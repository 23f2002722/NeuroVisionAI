from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent

MB = 1024 * 1024

# These mirror the paths hardcoded in services/case_service.py and rag/retriever.py.
# They are NOT configurable here because the pipeline ignores any override.
CHECKPOINTS = {
    "unimatch": REPO_ROOT / "models" / "segmentation" / "best_unimatch.pth",
    "ipixmatch": REPO_ROOT / "models" / "segmentation" / "chunk3_best_ipixmatch.pth",
    "reconstruction": REPO_ROOT / "models" / "reconstruction" / "conditional_mri_reconstruction.pth",
}
VECTOR_INDEX_DIR = REPO_ROOT / "rag" / "vectorstore"

DISCLAIMER = (
    "AI-assisted research output. This is not a medical diagnosis and is not "
    "a substitute for clinical interpretation."
)


def _bool(value: str | None, default: bool) -> bool:
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _float(value: str | None, default: float) -> float:
    if value is None or value.strip() == "":
        return default
    return float(value)


def _int(value: str | None, default: int) -> int:
    if value is None or value.strip() == "":
        return default
    return int(value)


def _list(value: str | None, default: tuple[str, ...]) -> tuple[str, ...]:
    if value is None or value.strip() == "":
        return default
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    pipeline_mode: str = "real"  # "real" | "mock"
    data_dir: Path = REPO_ROOT / "data"
    default_model: str = "unimatch"
    allowed_models: tuple[str, ...] = ("unimatch", "ipixmatch")

    max_upload_bytes: int = 500 * MB
    max_extracted_bytes: int = 2000 * MB
    max_files: int = 2000
    max_upload_files: int = 10
    max_compression_ratio: int = 500

    max_queue_size: int = 10
    job_timeout_seconds: int = 1800
    retention_days: float = 7.0
    cleanup_interval_seconds: int = 600

    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://localhost:5173",
    )

    # Upstream rag/llm.py raises (instead of falling back) when the key is
    # missing. Set REQUIRE_LLM_KEY=false once that is fixed upstream.
    require_llm_key: bool = True
    provisional_metrics_warning: bool = True

    mock_delay_seconds: float = 3.0
    mock_fail: bool = False

    log_level: str = "INFO"
    extra: dict = field(default_factory=dict)

    @property
    def cases_dir(self) -> Path:
        return self.data_dir / "cases"

    @classmethod
    def from_env(cls) -> "Settings":
        load_dotenv(REPO_ROOT / ".env")
        env = os.environ.get

        mode = (env("PIPELINE_MODE") or "real").strip().lower()
        if mode not in {"real", "mock"}:
            raise ValueError("PIPELINE_MODE must be 'real' or 'mock'")

        data_dir = Path(env("DATA_DIR") or REPO_ROOT / "data")
        if not data_dir.is_absolute():
            data_dir = REPO_ROOT / data_dir

        defaults = cls()
        return cls(
            pipeline_mode=mode,
            data_dir=data_dir,
            default_model=(env("DEFAULT_MODEL") or defaults.default_model).strip().lower(),
            allowed_models=_list(env("ALLOWED_MODELS"), defaults.allowed_models),
            max_upload_bytes=int(_float(env("MAX_UPLOAD_MB"), 500) * MB),
            max_extracted_bytes=int(_float(env("MAX_EXTRACTED_MB"), 2000) * MB),
            max_files=_int(env("MAX_FILES"), defaults.max_files),
            max_upload_files=_int(env("MAX_UPLOAD_FILES"), defaults.max_upload_files),
            max_compression_ratio=_int(env("MAX_COMPRESSION_RATIO"), defaults.max_compression_ratio),
            max_queue_size=_int(env("MAX_QUEUE_SIZE"), defaults.max_queue_size),
            job_timeout_seconds=_int(env("JOB_TIMEOUT_SECONDS"), defaults.job_timeout_seconds),
            retention_days=_float(env("RETENTION_DAYS"), defaults.retention_days),
            cleanup_interval_seconds=_int(env("CLEANUP_INTERVAL_SECONDS"), defaults.cleanup_interval_seconds),
            cors_origins=_list(env("CORS_ORIGINS"), defaults.cors_origins),
            require_llm_key=_bool(env("REQUIRE_LLM_KEY"), True),
            provisional_metrics_warning=_bool(env("PROVISIONAL_METRICS_WARNING"), True),
            mock_delay_seconds=_float(env("MOCK_DELAY_SECONDS"), defaults.mock_delay_seconds),
            mock_fail=_bool(env("MOCK_FAIL"), False),
            log_level=(env("LOG_LEVEL") or "INFO").upper(),
        )
