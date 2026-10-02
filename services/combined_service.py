from rag import report
from rag.service import generate_combined_report
from analysis.analyze_reconstruction import analyze_reconstruction
from analysis.output import (
    create_segmentation_previews,
    create_preview_metadata,
)
from pathlib import Path

from preprocessing.loader import prepare_case, load_prepared_case
from models.reconstruction.service import run_reconstruction_volume
from models.segmentation.array_runner import run_array_segmentation
from analysis.volume import analyze_volume

SEGMENTATION_CHECKPOINTS = {
    "unimatch": "models/segmentation/best_unimatch.pth",
    "ipixmatch": "models/segmentation/chunk3_best_ipixmatch.pth",
}


def run_reconstruction_analysis_case(
    input_path,
    output_dir,
    model_name="unimatch",
):
    input_path = Path(input_path)
    output_dir = Path(output_dir)

    if not input_path.exists():
        raise FileNotFoundError(
            f"Input case not found: {input_path}"
        )

    if model_name not in SEGMENTATION_CHECKPOINTS:
        raise ValueError(
            f"Unsupported segmentation model: {model_name}"
        )

    case = prepare_case(input_path)
    volume = load_prepared_case(case)

    image = volume["image"].copy()
    flair = image[0]

    reconstruction = run_reconstruction_volume(
        flair_volume=flair,
        output_dir=output_dir / "reconstruction",
        affine=volume["affine"],
    )

    image[0] = reconstruction["volume"]

    segmentation = run_array_segmentation(
        image=image,
        model_name=model_name,
        checkpoint_path=SEGMENTATION_CHECKPOINTS[model_name],
    )

    result = {
        "volume": "combined_case",
        "model": model_name,
        "slice_count": segmentation["slice_count"],
        "probabilities": segmentation["probabilities"],
        "predictions": segmentation["predictions"],
        "shape": volume["shape"],
        "voxel_spacing": volume["voxel_spacing"],
        "modalities": volume["modalities"],
        "image": image,
        "reconstruction": reconstruction,
    }

    ground_truth = case.get("ground_truth")

    if ground_truth:
        from models.segmentation.nifti_runner import (
            load_ground_truth,
            prepare_ground_truth,
        )

        result["ground_truth"] = prepare_ground_truth(
            load_ground_truth(ground_truth)
        )

    analysis = analyze_volume(result)

    reconstruction_analysis = analyze_reconstruction(
    reference_path=case["modalities"]["FLAIR"],
    reconstructed_path=reconstruction["output"],
)

    analysis = {
    "reconstruction": reconstruction_analysis,
    "segmentation": analysis,
}

    report = generate_combined_report(analysis)
    report_path = output_dir / "report.md"

    with open(
    report_path,
    "w",
    encoding="utf-8",
    ) as file:
        file.write(report["report"])

    preview_dir = output_dir / "segmentation"
    preview_dir.mkdir(parents=True, exist_ok=True)

    create_segmentation_previews(
    image=image,
    predictions=segmentation["predictions"],
    analysis=analysis["segmentation"],
    output_dir=preview_dir,
)

    create_preview_metadata(
    analysis["segmentation"],
    preview_dir,
)

    return {
    "input_type": case["input_type"],
    "model": model_name,
    "report_path": str(report_path),
    "segmentation": result,
    "analysis": analysis,
    "reconstruction": reconstruction,
    "report": report,
    "previews": {
        "WT": str(preview_dir / "preview_max_WT.png"),
        "TC": str(preview_dir / "preview_max_TC.png"),
        "ET": str(preview_dir / "preview_max_ET.png"),
        "metadata": str(preview_dir / "previews.json"),
    },
}