from __future__ import annotations

import json
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator, cast

from sqlalchemy import Boolean, DateTime, Integer, String, Text, create_engine, event, func, select, update, delete
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.engine import CursorResult


QUEUED, RUNNING, COMPLETED, FAILED = "queued", "running", "completed", "failed"


def utcnow() -> datetime:
    """Naive UTC (SQLite does not keep tzinfo); serialised with a trailing Z."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(value: datetime | None) -> str | None:
    return value.isoformat(timespec="seconds") + "Z" if value else None

def iso_required(value: datetime) -> str:
    return value.isoformat(timespec="seconds") + "Z"


class Base(DeclarativeBase):
    pass


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    status: Mapped[str] = mapped_column(String(16), index=True)
    error_code: Mapped[str | None] = mapped_column(String(48), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)

    model: Mapped[str] = mapped_column(String(32))
    pipeline_mode: Mapped[str] = mapped_column(String(8))
    input_type: Mapped[str] = mapped_column(String(16))
    ground_truth_supplied: Mapped[bool] = mapped_column(Boolean, default=False)
    file_count: Mapped[int] = mapped_column(Integer, default=0)

    analysis_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    previews_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    warnings_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    has_overlays_zip: Mapped[bool] = mapped_column(Boolean, default=False)
    report_source: Mapped[str | None] = mapped_column(String(16), nullable=True)

    # JSON helpers -----------------------------------------------------------
    @property
    def analysis(self) -> dict | None:
        return json.loads(self.analysis_json) if self.analysis_json else None

    @property
    def previews(self) -> dict | None:
        return json.loads(self.previews_json) if self.previews_json else None

    @property
    def warnings(self) -> list[dict]:
        return json.loads(self.warnings_json) if self.warnings_json else []


class Database:
    def __init__(self, path: Path):
        self.engine = create_engine(
            f"sqlite:///{Path(path).as_posix()}",
            connect_args={"check_same_thread": False, "timeout": 15},
        )

        @event.listens_for(self.engine, "connect")
        def _pragmas(dbapi_connection, _):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.close()

        self._sessions = sessionmaker(self.engine, expire_on_commit=False)

    def create_all(self) -> None:
        Base.metadata.create_all(self.engine)

    def dispose(self) -> None:
        self.engine.dispose()

    @contextmanager
    def session(self) -> Generator[Session, None, None]:
        session = self._sessions()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    # Reads ------------------------------------------------------------------
    def get(self, case_id: str) -> Case | None:
        with self.session() as s:
            return s.get(Case, case_id)

    def exists(self, case_id: str) -> bool:
        with self.session() as s:
            return s.get(Case, case_id) is not None

    def count_queued(self) -> int:
        with self.session() as s:
            return s.scalar(select(func.count()).select_from(Case).where(Case.status == QUEUED)) or 0

    def list_recent(self, limit: int) -> list[Case]:
        with self.session() as s:
            return list(s.scalars(select(Case).order_by(Case.created_at.desc()).limit(limit)))

    def expired_ids(self, now: datetime) -> list[str]:
        with self.session() as s:
            rows = s.scalars(select(Case.id).where(Case.expires_at < now, Case.status != RUNNING))
            return list(rows)

    # Writes -----------------------------------------------------------------
    def add_case(self, case: Case) -> None:
        with self.session() as s:
            s.add(case)

    def claim_next(self) -> str | None:
        """Atomically move the oldest queued case to running."""
        with self.session() as s:
            candidate = s.scalar(
                select(Case.id).where(Case.status == QUEUED).order_by(Case.created_at).limit(1)
            )
            if candidate is None:
                return None
            result = cast(
                CursorResult,
                s.execute(
                update(Case)
                .where(Case.id == candidate, Case.status == QUEUED)
                .values(status=RUNNING, started_at=utcnow())
            ))
            return candidate if result.rowcount == 1 else None

    def mark_completed(self, case_id: str, *, analysis: dict, previews: dict | None,
                       warnings: list[dict], has_overlays_zip: bool,
                       report_source: str, retention_days: float) -> None:
        from datetime import timedelta

        now = utcnow()
        with self.session() as s:
            s.execute(
                update(Case).where(Case.id == case_id).values(
                    status=COMPLETED,
                    finished_at=now,
                    expires_at=now + timedelta(days=retention_days),
                    analysis_json=json.dumps(analysis),
                    previews_json=json.dumps(previews) if previews else None,
                    warnings_json=json.dumps(warnings),
                    has_overlays_zip=has_overlays_zip,
                    report_source=report_source,
                    error_code=None,
                    error_message=None,
                )
            )

    def mark_failed(self, case_id: str, code: str, message: str, retention_days: float = 1.0) -> None:
        from datetime import timedelta

        now = utcnow()
        with self.session() as s:
            s.execute(
                update(Case).where(Case.id == case_id).values(
                    status=FAILED,
                    finished_at=now,
                    expires_at=now + timedelta(days=retention_days),
                    error_code=code,
                    error_message=message,
                )
            )

    def mark_running_interrupted(self) -> list[str]:
        """Startup recovery: anything left 'running' died with the previous process."""
        with self.session() as s:
            ids = list(s.scalars(select(Case.id).where(Case.status == RUNNING)))
            if ids:
                now = utcnow()
                s.execute(
                    update(Case).where(Case.id.in_(ids)).values(
                        status=FAILED,
                        finished_at=now,
                        error_code="INTERRUPTED",
                        error_message="The server restarted while this case was running. Please resubmit it.",
                    )
                )
            return ids

    def delete_case(self, case_id: str) -> bool:
        with self.session() as s:
            result = cast(
                CursorResult,
                s.execute(delete(Case).where(Case.id == case_id))
                )
            return result.rowcount > 0

    def delete_if_not_running(self, case_id: str) -> str:
        """Returns 'deleted', 'running' or 'missing'."""
        with self.session() as s:
            result = cast(
                CursorResult,
                s.execute(delete(Case).where(Case.id == case_id, Case.status != RUNNING))
                )
            if result.rowcount == 1:
                return "deleted"
            return "running" if s.get(Case, case_id) is not None else "missing"
