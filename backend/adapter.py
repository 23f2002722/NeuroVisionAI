"""Turns the files written by pipeline.run_pipeline into API-ready data."""
from __future__ import annotations

import json
from dataclasses import dataclass

from .config import Settings
from .storage import REGIONS, CasePaths

FALLBACK_MARKER = "Gemini report generation was unavailable"


class AdapterError(Exception):
    """The pipeline finished but its output is missing or malformed."""


@dataclass
class CollectedResult:
    analysis: dict
    previews: dict | None
    has_overlays_zip: bool
    report_source: str
    warnings: list[dict]


def _warning(code: str, message: str) -> dict:
    return {"code": code, "message": message}


def _read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise AdapterError(f"cannot read {path.name}: {exc}") from exc


def _read_previews(paths: CasePaths) -> dict | None:
    if not paths.preview_meta.is_file():
        return None
    try:
        meta = json.loads(paths.preview_meta.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None

    previews = {}
    for region in REGIONS:
        entry = meta.get(region)
        if isinstance(entry, dict) and paths.preview(region).is_file():
            previews[region] = {
                "label": entry.get("label", region),
                "slice": entry.get("slice"),
                "pixels": entry.get("pixels"),
            }
    return previews or None


def build_warnings(*, analysis: dict, settings: Settings, pipeline_mode: str,
                   ground_truth_supplied: bool, has_images: bool,
                   report_source: str) -> list[dict]:
    warnings: list[dict] = []

    if pipeline_mode == "mock":
        warnings.append(_warning("MOCK_DATA", "Synthetic mock output - this is not a real analysis."))

    if ground_truth_supplied:
        warnings.append(_warning(
            "GROUND_TRUTH_METRICS",
            "Dice was computed against the ground-truth segmentation supplied with this case. "
            "It is not an accuracy estimate for cases without ground truth."))
        if settings.provisional_metrics_warning:
            warnings.append(_warning(
                "PROVISIONAL_METRICS",
                "Case-level Dice values are provisional until the ground-truth label mapping "
                "has been validated."))

    for region in REGIONS:
        details = analysis["classes"].get(region, {})
        if details.get("predicted_pixels") == 0:
            warnings.append(_warning(
                "EMPTY_REGION",
                f"No {region} pixels were predicted; its preview shows an unannotated slice."))

    if report_source == "fallback":
        warnings.append(_warning(
            "FALLBACK_REPORT",
            "The AI report service was unavailable; this report was generated from the "
            "structured analysis only."))

    if not has_images:
        warnings.append(_warning("NO_IMAGES", "Preview images are not available for this input type."))

    return warnings


def collect(paths: CasePaths, *, settings: Settings, pipeline_mode: str,
            ground_truth_supplied: bool) -> CollectedResult:
    analysis = _read_json(paths.analysis)
    classes = analysis.get("classes") if isinstance(analysis, dict) else None
    if not isinstance(classes, dict) or any(not isinstance(classes.get(r), dict) for r in REGIONS):
        raise AdapterError("analysis.json does not contain WT/TC/ET class results")

    if not paths.report.is_file():
        raise AdapterError("report.md is missing")
    report_text = paths.report.read_text(encoding="utf-8", errors="replace")

    if pipeline_mode == "mock":
        report_source = "mock"
    elif FALLBACK_MARKER in report_text:
        report_source = "fallback"
    else:
        # Upstream does not report this yet; replace once run_pipeline returns it.
        report_source = "unknown"

    previews = _read_previews(paths)
    warnings = build_warnings(
        analysis=analysis, settings=settings, pipeline_mode=pipeline_mode,
        ground_truth_supplied=ground_truth_supplied, has_images=previews is not None,
        report_source=report_source)

    return CollectedResult(
        analysis=analysis,
        previews=previews,
        has_overlays_zip=paths.overlays_zip.is_file(),
        report_source=report_source,
        warnings=warnings,
    )
