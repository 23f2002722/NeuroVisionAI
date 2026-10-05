from __future__ import annotations

import os
from dataclasses import dataclass

from .config import CHECKPOINTS, VECTOR_INDEX_DIR, Settings


@dataclass(frozen=True)
class Check:
    name: str
    ok: bool
    detail: str
    code: str = "MODEL_UNAVAILABLE"
    blocking: bool = True  # blocks accepting new cases when failing (real mode only)


def run_checks(settings: Settings, model: str | None = None) -> list[Check]:
    checks: list[Check] = []

    try:
        settings.cases_dir.mkdir(parents=True, exist_ok=True)
        probe = settings.cases_dir / ".write_test"
        probe.write_text("ok")
        probe.unlink()
        checks.append(Check("data_dir_writable", True, str(settings.data_dir)))
    except OSError as exc:
        checks.append(Check("data_dir_writable", False, str(exc), code="STORAGE_UNAVAILABLE"))

    if settings.pipeline_mode == "mock":
        return checks

    for name, path in CHECKPOINTS.items():
        if model is not None and name != model:
            continue
        checks.append(Check(f"checkpoint_{name}", path.is_file(),
                            f"{path.name} {'found' if path.is_file() else 'missing'}"))

    index_ok = (VECTOR_INDEX_DIR / "index.faiss").is_file() and (VECTOR_INDEX_DIR / "documents.json").is_file()
    checks.append(Check("vector_index", index_ok,
                        "rag/vectorstore present" if index_ok
                        else "rag/vectorstore missing - run the index build (rag/index.py)"))

    key_ok = bool(os.getenv("GEMINI_API_KEY"))
    checks.append(Check("gemini_api_key", key_ok,
                        "configured" if key_ok else "GEMINI_API_KEY is not set",
                        code="LLM_NOT_CONFIGURED", blocking=settings.require_llm_key))
    return checks
