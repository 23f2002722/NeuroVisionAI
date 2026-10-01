from __future__ import annotations

import json
import logging
import os
import signal
import subprocess
import sys
import threading
import time

from . import adapter
from .config import REPO_ROOT, Settings
from .db import Database
from .storage import case_paths, remove_tree

log = logging.getLogger(__name__)


def kill_process_tree(proc: subprocess.Popen) -> None:
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                           capture_output=True, check=False)
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except (ProcessLookupError, PermissionError, OSError):
        proc.kill()


class Dispatcher(threading.Thread):
    def __init__(self, db: Database, settings: Settings):
        super().__init__(name="job-dispatcher", daemon=True)
        self.db = db
        self.settings = settings
        self._wake = threading.Event()
        self._stopping = threading.Event()
        self._proc: subprocess.Popen | None = None

    def wake(self) -> None:
        self._wake.set()

    def stop(self) -> None:
        self._stopping.set()
        self._wake.set()
        proc = self._proc
        if proc is not None and proc.poll() is None:
            kill_process_tree(proc)

    def run(self) -> None:
        log.info("dispatcher started (mode=%s)", self.settings.pipeline_mode)
        while not self._stopping.is_set():
            case_id = self.db.claim_next()
            if case_id is None:
                self._wake.wait(timeout=2.0)
                self._wake.clear()
                continue
            try:
                self._run_job(case_id)
            except Exception:  # keep the dispatcher alive no matter what
                log.exception("unexpected error while running case %s", case_id)
                self.db.mark_failed(case_id, "PIPELINE_FAILED", "Internal error while running the job.")
        log.info("dispatcher stopped")

    def _command(self, case, paths) -> list[str]:
        cmd = [
            sys.executable, "-m", "backend.worker_entry",
            "--mode", case.pipeline_mode,
            "--input", str(paths.input),
            "--output", str(paths.output),
            "--model", case.model,
            "--result", str(paths.result_file),
        ]
        if case.pipeline_mode == "mock":
            cmd += ["--mock-delay", str(self.settings.mock_delay_seconds)]
            if self.settings.mock_fail:
                cmd.append("--mock-fail")
        return cmd

    def _run_job(self, case_id: str) -> None:
        case = self.db.get(case_id)
        if case is None:  # deleted between claim and start
            return
        paths = case_paths(self.settings.cases_dir, case_id)
        paths.output.mkdir(parents=True, exist_ok=True)

        env = os.environ.copy()
        env["PYTHONPATH"] = str(REPO_ROOT) + os.pathsep + env.get("PYTHONPATH", "")
        env["PYTHONUNBUFFERED"] = "1"

        popen_kwargs: dict = {}
        if os.name == "nt":
            popen_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        else:
            popen_kwargs["start_new_session"] = True

        started = time.monotonic()
        timed_out = False
        with open(paths.log, "ab") as log_file:
            self._proc = subprocess.Popen(
                self._command(case, paths), cwd=REPO_ROOT, env=env,
                stdout=log_file, stderr=subprocess.STDOUT, **popen_kwargs)
            try:
                return_code = self._proc.wait(timeout=self.settings.job_timeout_seconds)
            except subprocess.TimeoutExpired:
                timed_out = True
                kill_process_tree(self._proc)
                return_code = self._proc.wait()
            finally:
                self._proc = None

        elapsed = time.monotonic() - started
        retention = self.settings.retention_days

        try:
            if self._stopping.is_set() and return_code != 0:
                self.db.mark_failed(case_id, "INTERRUPTED", "The server shut down while this case was running.")
            elif timed_out:
                self.db.mark_failed(case_id, "TIMEOUT",
                                    f"The job exceeded the {self.settings.job_timeout_seconds}s time limit.")
            elif return_code == 0 and paths.result_file.is_file():
                self._complete(case, paths, retention)
            else:
                code, message = "PIPELINE_FAILED", f"The worker exited unexpectedly (exit code {return_code})."
                if paths.error_file.is_file():
                    try:
                        data = json.loads(paths.error_file.read_text(encoding="utf-8"))
                        code, message = data.get("code", code), data.get("message", message)
                    except ValueError:
                        pass
                self.db.mark_failed(case_id, code, message, retention_days=retention)
        finally:
            remove_tree(paths.input)  # raw MRI data is never kept after the job
            remove_tree(paths.upload)

        final = self.db.get(case_id)
        log.info("case %s finished: status=%s model=%s mode=%s elapsed=%.1fs",
                 case_id, final.status if final else "deleted", case.model, case.pipeline_mode, elapsed)

    def _complete(self, case, paths, retention: float) -> None:
        try:
            collected = adapter.collect(
                paths, settings=self.settings, pipeline_mode=case.pipeline_mode,
                ground_truth_supplied=case.ground_truth_supplied)
        except adapter.AdapterError as exc:
            log.error("case %s: invalid pipeline output: %s", case.id, exc)
            self.db.mark_failed(case.id, "PIPELINE_FAILED",
                                "The pipeline finished but produced invalid output.", retention_days=retention)
            return
        self.db.mark_completed(
            case.id, analysis=collected.analysis, previews=collected.previews,
            warnings=collected.warnings, has_overlays_zip=collected.has_overlays_zip,
            report_source=collected.report_source, retention_days=retention)
