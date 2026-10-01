"""Subprocess entry point:  python -m backend.worker_entry ...

Runs exactly one job. Always started with the repository root as the working
directory because services/case_service.py uses relative checkpoint paths.
Success  -> writes <result> (JSON) and exits 0.
Failure  -> writes error.json next to <result>, full traceback goes to stderr
            (captured in job.log, never sent to API clients), exits 1.
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
from pathlib import Path


def classify_exception(exc: BaseException) -> tuple[str, str]:
    """Map pipeline exceptions to (error_code, client-safe message)."""
    text = str(exc)
    lowered = text.lower()
    kind = type(exc).__name__

    if isinstance(exc, FileNotFoundError) and ("checkpoint" in lowered or ".pth" in lowered):
        return "MODEL_UNAVAILABLE", "A required model checkpoint is not available on the server."
    if isinstance(exc, FileNotFoundError) and ("faiss" in lowered or "vectorstore" in lowered or "documents.json" in lowered):
        return "MODEL_UNAVAILABLE", "The knowledge index required for report generation is not available."
    if isinstance(exc, ValueError) and "unsupported segmentation model" in lowered:
        return "UNKNOWN_MODEL", "The requested segmentation model is not supported."
    if isinstance(exc, ValueError) and (
        "incomplete dicom" in lowered or "could not identify" in lowered
        or "no supported mri files" in lowered or "multiple nifti" in lowered
    ):
        return "INVALID_MRI_CASE", text
    if isinstance(exc, ValueError) and "gemini_api_key" in lowered:
        return "LLM_NOT_CONFIGURED", "Report generation is not configured on the server."
    if isinstance(exc, MemoryError) or "outofmemory" in kind.lower():
        return "PIPELINE_FAILED", "The server ran out of memory while processing this case."
    return "PIPELINE_FAILED", "The analysis pipeline failed. See the server log for details."


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["real", "mock"], required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--result", required=True)
    parser.add_argument("--mock-delay", type=float, default=3.0)
    parser.add_argument("--mock-fail", action="store_true")
    args = parser.parse_args(argv)

    result_path = Path(args.result)
    error_path = result_path.with_name("error.json")

    try:
        if args.mode == "mock":
            from backend.mock_pipeline import run_mock

            pipeline_result = run_mock(args.input, args.output, args.model,
                                       delay=args.mock_delay, fail=args.mock_fail)
        else:
            from pipeline import run_pipeline  # repo-root pipeline.py

            pipeline_result = run_pipeline(
                input_path=args.input, output_dir=args.output, model_name=args.model)

        _write_json(result_path, {"status": "success", "pipeline": pipeline_result})
        return 0
    except BaseException as exc:  # noqa: BLE001 - last line of defence in a subprocess
        traceback.print_exc()
        code, message = classify_exception(exc)
        _write_json(error_path, {"code": code, "message": message, "error_type": type(exc).__name__})
        return 1


if __name__ == "__main__":
    sys.exit(main())
