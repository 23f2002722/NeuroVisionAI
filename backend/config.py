from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, TypeVar

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent

MB = 1024 * 1024

# These mirror the paths hardcoded in services/case_service.py and rag/retriever.py.
# They are NOT configurable here because the pipeline ignores any override.
CHECKPOINTS = {
    "unimatch": REPO_ROOT / "models" / "segmentation" / "best_unimatch.pth",
    "ipixmatch": REPO_ROOT / "models" / "segmentation" / "chunk3_best_ipixmatch.pth",
}
VECTOR_INDEX_DIR = REPO_ROOT / "rag" / "vectorstore"

DISCLAIMER = (
    "AI-assisted research output. This is not a medical diagnosis and is not "
    "a substitute for clinical interpretation."
)


T = TypeVar("T")


def _env(
    name: str,
    default: T,
    cast: Callable[[str], T],
) -> T:
    """Read an env var; empty or unset gives `default`."""
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return cast(raw.strip())


def _as_bool(value: str) -> bool:
    return value.lower() in {"1", "true", "yes", "on"}


def _as_list(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    """Everything the backend needs. Only the fields read in from_env() are
    configurable through the environment; the rest are plain defaults that
    can still be overridden in code (e.g. in tests)."""

    # --- environment-configurable (see .env.example) ---
    pipeline_mode: str = "real"  # "real" | "mock"
    data_dir: Path = REPO_ROOT / "data"
    host: str = "127.0.0.1"
    port: int = 8000
    max_upload_bytes: int = 500 * MB
    job_timeout_seconds: int = 1800
    retention_days: float = 7.0
    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://localhost:5173",
    )
    mock_delay_seconds: float = 3.0
    mock_fail: bool = False
    log_level: str = "INFO"

    # --- fixed defaults ---
    default_model: str = "unimatch"
    allowed_models: tuple[str, ...] = tuple(CHECKPOINTS)
    max_extracted_bytes: int = 2000 * MB
    max_files: int = 2000
    max_upload_files: int = 10
    max_compression_ratio: int = 500
    max_queue_size: int = 10
    cleanup_interval_seconds: int = 600

    # Upstream rag/llm.py raises (instead of falling back to the deterministic
    # report) when GEMINI_API_KEY is missing, so real mode refuses new cases
    # without it. Set to False once that is fixed upstream.
    require_llm_key: bool = True
    provisional_metrics_warning: bool = True

    @property
    def cases_dir(self) -> Path:
        return self.data_dir / "cases"

    @classmethod
    def from_env(cls) -> "Settings":
        load_dotenv(REPO_ROOT / ".env")
        d = cls()

        mode = _env("PIPELINE_MODE", d.pipeline_mode, str).lower()
        if mode not in {"real", "mock"}:
            raise ValueError("PIPELINE_MODE must be 'real' or 'mock'")

        data_dir = Path(_env("DATA_DIR", d.data_dir, Path))

        if not data_dir.is_absolute():
            data_dir = REPO_ROOT / data_dir

        return cls(
            pipeline_mode=mode,
            data_dir=data_dir,
            host=_env("BACKEND_HOST", d.host, str),
            port=_env("BACKEND_PORT", d.port, int),
            max_upload_bytes=int(
                _env(
                    "MAX_UPLOAD_MB",
                    d.max_upload_bytes / MB,
                    float,
                )
                * MB
            ),
            job_timeout_seconds=_env(
                "JOB_TIMEOUT_SECONDS",
                d.job_timeout_seconds,
                int,
            ),
            retention_days=_env(
                "RETENTION_DAYS",
                d.retention_days,
                float,
            ),
            cors_origins=_env(
                "CORS_ORIGINS",
                d.cors_origins,
                _as_list,
            ),
            mock_delay_seconds=_env(
                "MOCK_DELAY_SECONDS",
                d.mock_delay_seconds,
                float,
            ),
            mock_fail=_env(
                "MOCK_FAIL",
                d.mock_fail,
                _as_bool,
            ),
            log_level=_env("LOG_LEVEL", d.log_level, str).upper(),
        )
