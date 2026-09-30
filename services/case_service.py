from unittest import case

from models.segmentation.dicom_runner import run_dicom_segmentation
from preprocessing.loader import prepare_case
from models.segmentation.nifti_runner import run_nifti_segmentation
from analysis.volume import analyze_volume
from rag.service import generate_analysis_report

SEGMENTATION_CHECKPOINTS = {
    "unimatch": "models/segmentation/best_unimatch.pth",
    "ipixmatch": "models/segmentation/chunk3_best_ipixmatch.pth",
}


def run_case(upload_path, model_name="unimatch"):
    if model_name not in SEGMENTATION_CHECKPOINTS:
        raise ValueError(f"Unsupported segmentation model: {model_name}")

    case = prepare_case(upload_path)

    if case["input_type"] == "nifti":
        result = run_nifti_segmentation(
            case["modalities"],
        model_name,
        SEGMENTATION_CHECKPOINTS[model_name],
        )
    elif case["input_type"] == "dicom":
        result = run_dicom_segmentation(
            case["series"],
            model_name,
            SEGMENTATION_CHECKPOINTS[model_name],
        )
    else:
        raise ValueError(
            f"Unsupported input type: {case['input_type']}"
        )

    analysis = analyze_volume(result)

    report = generate_analysis_report(
        analysis=analysis,
        model_name=model_name,
    )

    return {
        "input_type": case["input_type"],
        "model": model_name,
        "analysis": analysis,
        "sources": report["sources"],
        "report": report["report"],
    }