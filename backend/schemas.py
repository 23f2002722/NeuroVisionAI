from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel

SCHEMA_VERSION = "0.1"
Status = Literal["queued", "running", "completed", "failed"]


class WarningItem(BaseModel):
    code: str
    message: str


class ErrorInfo(BaseModel):
    code: str
    message: str


class ImageInfo(BaseModel):
    region: Literal["WT", "TC", "ET"]
    label: str
    slice: int | None
    pixels: int | None
    url: str


class Downloads(BaseModel):
    overlays_zip: str | None


class CaseCreated(BaseModel):
    case_id: str
    status: Status
    status_url: str


class CaseResponse(BaseModel):
    schema_version: str = SCHEMA_VERSION
    case_id: str
    status: Status
    created_at: str
    started_at: str | None
    finished_at: str | None
    expires_at: str
    elapsed_seconds: float | None
    model: str
    input_type: str
    pipeline_mode: Literal["real", "mock"]
    ground_truth_supplied: bool
    analysis: dict[str, Any] | None
    images: list[ImageInfo]
    downloads: Downloads
    report_available: bool
    warnings: list[WarningItem]
    error: ErrorInfo | None
    disclaimer: str


class ReportResponse(BaseModel):
    case_id: str
    format: Literal["markdown"] = "markdown"
    text: str
    report_source: Literal["llm", "fallback", "mock", "unknown"]
    sources: list[str] | None  # null until the pipeline returns RAG sources
    disclaimer: str


class CaseListItem(BaseModel):
    case_id: str
    status: Status
    created_at: str
    model: str
    input_type: str
    pipeline_mode: Literal["real", "mock"]


class HealthCheck(BaseModel):
    name: str
    ok: bool
    detail: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    pipeline_mode: Literal["real", "mock"]
    dispatcher_alive: bool
    checks: list[HealthCheck]
