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

    if case["input_type"] != "nifti":
        raise NotImplementedError(
            "DICOM inference will be connected in the next step."
        )

    result = run_nifti_segmentation(
        case["modalities"],
        model_name,
        SEGMENTATION_CHECKPOINTS[model_name],
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