from __future__ import annotations

import logging
import threading
import time

from .config import Settings
from .db import Database, utcnow
from .storage import case_paths, is_valid_case_id, remove_tree

log = logging.getLogger(__name__)
ORPHAN_MIN_AGE_SECONDS = 3600


def recover_on_startup(db: Database, settings: Settings) -> list[str]:
    interrupted = db.mark_running_interrupted()
    for case_id in interrupted:
        paths = case_paths(settings.cases_dir, case_id)
        remove_tree(paths.input)
        remove_tree(paths.upload)
    if interrupted:
        log.warning("marked %d interrupted case(s) as failed", len(interrupted))
    return interrupted


def purge_expired(db: Database, settings: Settings) -> int:
    count = 0
    for case_id in db.expired_ids(utcnow()):
        remove_tree(case_paths(settings.cases_dir, case_id).root)
        db.delete_case(case_id)
        count += 1
    if count:
        log.info("purged %d expired case(s)", count)
    return count


def purge_orphans(db: Database, settings: Settings, min_age_seconds: int = ORPHAN_MIN_AGE_SECONDS) -> int:
    """Delete case directories with no database row (e.g. a crash during upload)."""
    if not settings.cases_dir.is_dir():
        return 0
    count = 0
    now = time.time()
    for entry in settings.cases_dir.iterdir():
        if not entry.is_dir() or not is_valid_case_id(entry.name) or db.exists(entry.name):
            continue
        if now - entry.stat().st_mtime >= min_age_seconds:
            remove_tree(entry)
            count += 1
    if count:
        log.info("purged %d orphaned case directorie(s)", count)
    return count


class Janitor(threading.Thread):
    def __init__(self, db: Database, settings: Settings):
        super().__init__(name="janitor", daemon=True)
        self.db, self.settings = db, settings
        self._stopping = threading.Event()

    def stop(self) -> None:
        self._stopping.set()

    def run(self) -> None:
        while not self._stopping.is_set():
            try:
                purge_expired(self.db, self.settings)
                purge_orphans(self.db, self.settings)
            except Exception:
                log.exception("janitor pass failed")
            self._stopping.wait(self.settings.cleanup_interval_seconds)
