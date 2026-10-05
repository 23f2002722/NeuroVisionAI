from __future__ import annotations

from typing import Any, Literal, TypeAlias

from pydantic import BaseModel


SCHEMA_VERSION = "0.1"

Status: TypeAlias = Literal[
    "queued",
    "running",
    "completed",
    "failed",
]

PipelineMode: TypeAlias = Literal[
    "real",
    "mock",
]

ReportSource: TypeAlias = Literal[
    "llm",
    "fallback",
    "mock",
    "unknown",
]

ImageRegion: TypeAlias = Literal[
    "WT",
    "TC",
    "ET",
]


class WarningItem(BaseModel):
    code: str
    message: str


class ErrorInfo(BaseModel):
    code: str
    message: str


class ImageInfo(BaseModel):
    region: ImageRegion
    label: str
    slice: int | None = None
    pixels: int | None = None
    url: str


class Downloads(BaseModel):
    overlays_zip: str | None = None


class CaseCreated(BaseModel):
    case_id: str
    status: Status
    status_url: str


class CaseResponse(BaseModel):
    schema_version: str = SCHEMA_VERSION

    case_id: str
    status: Status

    created_at: str
    started_at: str | None = None
    finished_at: str | None = None
    expires_at: str

    elapsed_seconds: float | None = None

    model: str
    input_type: str
    pipeline_mode: PipelineMode
    ground_truth_supplied: bool

    analysis: dict[str, Any] | None = None
    images: list[ImageInfo] = []
    downloads: Downloads
    report_available: bool

    warnings: list[WarningItem] = []
    error: ErrorInfo | None = None

    disclaimer: str


class ReportResponse(BaseModel):
    case_id: str
    format: Literal["markdown"] = "markdown"
    text: str
    report_source: ReportSource
    sources: list[str] | None = None
    disclaimer: str


class CaseListItem(BaseModel):
    case_id: str
    status: Status
    created_at: str
    model: str
    input_type: str
    pipeline_mode: PipelineMode


class HealthCheck(BaseModel):
    name: str
    ok: bool
    detail: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    pipeline_mode: PipelineMode
    dispatcher_alive: bool
    checks: list[HealthCheck]
