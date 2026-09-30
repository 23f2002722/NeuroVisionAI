from preprocessing.loader import prepare_case
from models.segmentation.nifti_runner import run_nifti_segmentation
from models.segmentation.dicom_runner import run_dicom_segmentation
from analysis.volume import analyze_volume
from rag.service import generate_analysis_report
from pathlib import Path

SEGMENTATION_CHECKPOINTS = {
    "unimatch": "models/segmentation/best_unimatch.pth",
    "ipixmatch": "models/segmentation/chunk3_best_ipixmatch.pth",
}


def run_case(upload_path, model_name="unimatch"):
    input_path = Path(upload_path)

    if not input_path.exists():
        raise FileNotFoundError(
            f"Input case not found: {input_path}"
        )

    if not input_path.is_file() and not input_path.is_dir():
        raise ValueError(
            f"Invalid input path: {input_path}"
        )


    if model_name not in SEGMENTATION_CHECKPOINTS:
        raise ValueError(f"Unsupported segmentation model: {model_name}")

    checkpoint_path = Path(
        SEGMENTATION_CHECKPOINTS[model_name]
    )

    if not checkpoint_path.is_file():
        raise FileNotFoundError(
            f"Segmentation checkpoint not found: {checkpoint_path}"
        )

    case = prepare_case(upload_path)

    if case["input_type"] == "nifti":
        result = run_nifti_segmentation(
            case["modalities"],
            model_name,
            str(checkpoint_path),
            ground_truth_path=case.get("ground_truth"),
        )
    elif case["input_type"] == "dicom":
        result = run_dicom_segmentation(
            case["series"],
            model_name,
            str(checkpoint_path),
        )
    else:
        raise ValueError(f"Unsupported input type: {case['input_type']}")

    analysis = analyze_volume(result)

    report = generate_analysis_report(
        analysis=analysis,
        model_name=model_name,
    )

    return {
        "input_type": case["input_type"],
        "model": model_name,
        "analysis": analysis,
        "segmentation": result,
        "sources": report["sources"],
        "report": report["report"],
    }