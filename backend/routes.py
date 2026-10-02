from __future__ import annotations
 
import logging
from datetime import timedelta
 
from fastapi import APIRouter, File, Form, Query, Request, UploadFile
from fastapi.responses import FileResponse, Response
 
from . import readiness
from .config import DISCLAIMER
from .db import (
    COMPLETED,
    FAILED,
    QUEUED,
    Case,
    iso,
    iso_required,
    utcnow,
)
from .errors import ApiError
from .intake import save_uploads, validate_case
from .schemas import (
    CaseCreated,
    CaseListItem,
    CaseResponse,
    Downloads,
    ErrorInfo,
    HealthCheck,
    HealthResponse,
    ImageInfo,
    ReportResponse,
    WarningItem,
)
from .storage import (
    REGIONS,
    case_paths,
    is_valid_case_id,
    new_case_id,
    remove_tree,
)
 
 
log = logging.getLogger(__name__)
 
router = APIRouter(prefix="/api")
 
MULTIPART_OVERHEAD = 1024 * 1024
 
def _case_url(case_id: str) -> str:
    return f"/api/cases/{case_id}"
 
 
def _error_info(case: Case) -> ErrorInfo | None:
    """Build ErrorInfo only when both error fields are present."""
    if case.status != FAILED:
        return None
 
    if case.error_code is None or case.error_message is None:
        log.error(
            "Failed case %s has incomplete error information",
            case.id,
        )
        return None
 
    return ErrorInfo(
        code=case.error_code,
        message=case.error_message,
    )
 
 
def _load_case(request: Request, case_id: str) -> Case:
    case = (
        request.app.state.db.get(case_id)
        if is_valid_case_id(case_id)
        else None
    )
 
    if case is None:
        raise ApiError(
            404,
            "CASE_NOT_FOUND",
            "No case with this id exists (it may have expired).",
        )
 
    return case
 
 
def _require_completed(case: Case) -> None:
    if case.status == FAILED:
        raise ApiError(
            409,
            "CASE_FAILED",
            "This case failed; no results are available.",
        )
 
    if case.status != COMPLETED:
        raise ApiError(
            409,
            "NOT_READY",
            "This case is not finished yet.",
        )
 
 
def _build_case_response(case: Case) -> CaseResponse:
    base = _case_url(case.id)
 
    images: list[ImageInfo] = []
 
    if case.status == COMPLETED and case.previews:
        for region in REGIONS:
            info = case.previews.get(region)
 
            if not info:
                continue
 
            images.append(
                ImageInfo(
                    region=region,
                    label=info["label"],
                    slice=info["slice"],
                    pixels=info["pixels"],
                    url=f"{base}/images/{region}",
                )
            )
 
    elapsed: float | None = None
 
    if case.started_at:
        elapsed = round(
            (
                (case.finished_at or utcnow())
                - case.started_at
            ).total_seconds(),
            1,
        )
 
    done = case.status == COMPLETED
 
    return CaseResponse(
        case_id=case.id,
        status=case.status,
        created_at=iso_required(case.created_at),
        started_at=iso(case.started_at),
        finished_at=iso(case.finished_at),
        expires_at=iso_required(case.expires_at),
        elapsed_seconds=elapsed,
        model=case.model,
        input_type=case.input_type,
        pipeline_mode=case.pipeline_mode,
        ground_truth_supplied=case.ground_truth_supplied,
        analysis=case.analysis if done else None,
        images=images,
        downloads=Downloads(
            overlays_zip=(
                f"{base}/download/overlays"
                if done and case.has_overlays_zip
                else None
            )
        ),
        report_available=done,
        warnings=[
            WarningItem(**warning)
            for warning in case.warnings
        ],
        error=_error_info(case),
        disclaimer=DISCLAIMER,
    )
 
 
@router.post(
    "/cases",
    response_model=CaseCreated,
    status_code=202,
)
def create_case(
    request: Request,
    files: list[UploadFile] = File(...),
    model: str | None = Form(None),
):
    state = request.app.state
    settings = state.settings
    db = state.db
 
    chosen = (model or settings.default_model).strip().lower()
 
    if chosen not in settings.allowed_models:
        raise ApiError(
            422,
            "UNKNOWN_MODEL",
            (
                f"Unknown model '{chosen}'. "
                f"Supported: {', '.join(settings.allowed_models)}."
            ),
        )
 
    declared = request.headers.get("content-length")
 
    if (
        declared
        and declared.isdigit()
        and int(declared)
        > settings.max_upload_bytes + MULTIPART_OVERHEAD
    ):
        raise ApiError(
            413,
            "FILE_TOO_LARGE",
            (
                "Upload exceeds the "
                f"{settings.max_upload_bytes // (1024 * 1024)} MB limit."
            ),
        )
 
    if settings.pipeline_mode == "real":
        for check in readiness.run_checks(settings, chosen):
            if not check.ok and check.blocking:
                raise ApiError(
                    503,
                    check.code,
                    check.detail,
                )
 
    if db.count_queued() >= settings.max_queue_size:
        raise ApiError(
            429,
            "QUEUE_FULL",
            "The server is busy. Please try again shortly.",
        )
 
    case_id = new_case_id()
    paths = case_paths(
        settings.cases_dir,
        case_id,
    )
 
    try:
        save_uploads(
            [(f.filename or "", f.file) for f in files],
            paths,
            settings,
        )
 
        info = validate_case(paths.input)
 
    except ApiError:
        remove_tree(paths.root)
        raise
 
    except Exception:
        log.exception("Unexpected intake failure")
        remove_tree(paths.root)
 
        raise ApiError(
            500,
            "INTERNAL_ERROR",
            "The upload could not be processed.",
        )
 
    now = utcnow()
 
    db.add_case(
        Case(
            id=case_id,
            status=QUEUED,
            created_at=now,
            expires_at=now + timedelta(
                days=settings.retention_days
            ),
            model=chosen,
            pipeline_mode=settings.pipeline_mode,
            input_type=info.input_type,
            ground_truth_supplied=info.ground_truth_supplied,
            file_count=info.file_count,
        )
    )
 
    state.dispatcher.wake()
 
    log.info(
        "Case %s queued (model=%s, type=%s, files=%d)",
        case_id,
        chosen,
        info.input_type,
        info.file_count,
    )
 
    return CaseCreated(
        case_id=case_id,
        status=QUEUED,
        status_url=_case_url(case_id),
    )
 
 
@router.get(
    "/cases",
    response_model=list[CaseListItem],
)
def list_cases(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
):
    cases = request.app.state.db.list_recent(limit)
 
    return [
        CaseListItem(
            case_id=case.id,
            status=case.status,
            created_at=iso_required(case.created_at),
            model=case.model,
            input_type=case.input_type,
            pipeline_mode=case.pipeline_mode,
        )
        for case in cases
    ]
 
 
@router.get(
    "/cases/{case_id}",
    response_model=CaseResponse,
)
def get_case(
    request: Request,
    case_id: str,
):
    return _build_case_response(
        _load_case(request, case_id)
    )
 
 
@router.get(
    "/cases/{case_id}/report",
    response_model=ReportResponse,
)
def get_report(
    request: Request,
    case_id: str,
):
    case = _load_case(request, case_id)
    _require_completed(case)
 
    paths = case_paths(
        request.app.state.settings.cases_dir,
        case_id,
    )
 
    if not paths.report.is_file():
        raise ApiError(
            404,
            "NO_REPORT",
            "The report file is no longer available.",
        )
 
    return ReportResponse(
        case_id=case_id,
        text=paths.report.read_text(
            encoding="utf-8",
            errors="replace",
        ),
        report_source=case.report_source or "unknown",
        sources=None,
        disclaimer=DISCLAIMER,
    )
 
 
@router.get("/cases/{case_id}/images/{region}")
def get_image(
    request: Request,
    case_id: str,
    region: str,
):
    case = _load_case(request, case_id)
    _require_completed(case)
 
    region = region.upper()
 
    if region not in REGIONS:
        raise ApiError(
            404,
            "IMAGE_NOT_FOUND",
            "Region must be one of WT, TC, ET.",
        )
 
    path = case_paths(
        request.app.state.settings.cases_dir,
        case_id,
    ).preview(region)
 
    if (
        not case.previews
        or region not in case.previews
        or not path.is_file()
    ):
        raise ApiError(
            404,
            "NO_IMAGES",
            "No preview image is available for this case.",
        )
 
    return FileResponse(
        path,
        media_type="image/png",
        headers={
            "Cache-Control": "private, max-age=3600",
        },
    )
 
 
@router.get("/cases/{case_id}/download/overlays")
def download_overlays(
    request: Request,
    case_id: str,
):
    case = _load_case(request, case_id)
    _require_completed(case)
 
    path = case_paths(
        request.app.state.settings.cases_dir,
        case_id,
    ).overlays_zip
 
    if not case.has_overlays_zip or not path.is_file():
        raise ApiError(
            404,
            "NO_OVERLAYS",
            "No overlay archive is available for this case.",
        )
 
    return FileResponse(
        path,
        media_type="application/zip",
        filename=f"neurovisionai_{case_id[:8]}_overlays.zip",
    )
 
 
@router.delete(
    "/cases/{case_id}",
    status_code=204,
)
def delete_case(
    request: Request,
    case_id: str,
):
    if not is_valid_case_id(case_id):
        raise ApiError(
            404,
            "CASE_NOT_FOUND",
            "No case with this id exists.",
        )
 
    outcome = request.app.state.db.delete_if_not_running(
        case_id
    )
 
    if outcome == "missing":
        raise ApiError(
            404,
            "CASE_NOT_FOUND",
            "No case with this id exists.",
        )
 
    if outcome == "running":
        raise ApiError(
            409,
            "CASE_RUNNING",
            (
                "A running case cannot be deleted. "
                "Try again when it finishes."
            ),
        )
 
    remove_tree(
        case_paths(
            request.app.state.settings.cases_dir,
            case_id,
        ).root
    )
 
    return Response(status_code=204)
 
 
@router.get(
    "/health",
    response_model=HealthResponse,
)
def health(request: Request):
    state = request.app.state
 
    checks = readiness.run_checks(
        state.settings
    )
 
    alive = state.dispatcher.is_alive()
    ok = alive and all(
        check.ok for check in checks
    )
 
    return HealthResponse(
        status="ok" if ok else "degraded",
        pipeline_mode=state.settings.pipeline_mode,
        dispatcher_alive=alive,
        checks=[
            HealthCheck(
                name=check.name,
                ok=check.ok,
                detail=check.detail,
            )
            for check in checks
        ],
    )
