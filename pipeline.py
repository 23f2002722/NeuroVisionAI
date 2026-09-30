from pathlib import Path
import json
import shutil

from services.case_service import run_case
from analysis.visualization import save_segmentation_overlay
from analysis.output import (
    create_segmentation_zip,
    create_segmentation_previews,
    create_preview_metadata,
)


def run_pipeline(input_path, output_dir, model_name="unimatch"):
    input_path = Path(input_path)
    output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    result = run_case(
        str(input_path),
        model_name=model_name,
    )

    with open(
        output_dir / "analysis.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            result["analysis"],
            file,
            indent=2,
            default=str,
        )

    with open(
        output_dir / "report.md",
        "w",
        encoding="utf-8",
    ) as file:
        file.write(result["report"])

    segmentation_dir = output_dir / "segmentation"
    segmentation_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    segmentation_zip = None
    previews = None

    if result["input_type"] == "nifti":
        image = result["segmentation"]["image"]
        predictions = result["segmentation"]["predictions"]

        slice_count = min(
            image.shape[3],
            predictions.shape[1],
        )

        for slice_index in range(slice_count):
            save_segmentation_overlay(
                image=image,
                predictions=predictions,
                output_dir=segmentation_dir,
                slice_index=slice_index,
            )

        create_segmentation_previews(
            image=image,
            predictions=predictions,
            analysis=result["analysis"],
            output_dir=segmentation_dir,
        )

        previews_dir = output_dir / "previews"
        previews_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        for class_name in ("WT", "TC", "ET"):
            source = (
                segmentation_dir
                / f"preview_max_{class_name}.png"
            )
            destination = (
                previews_dir
                / f"{class_name}.png"
            )

            shutil.copy2(
                source,
                destination,
            )

        create_preview_metadata(
            result["analysis"],
            previews_dir,
        )

        segmentation_zip = create_segmentation_zip(
            segmentation_dir,
            output_dir / "segmentation_overlays",
        )

        shutil.rmtree(segmentation_dir)

        previews = {
            "WT": str(
                previews_dir / "WT.png"
            ),
            "TC": str(
                previews_dir / "TC.png"
            ),
            "ET": str(
                previews_dir / "ET.png"
            ),
            "metadata": str(
                previews_dir / "previews.json"
            ),
        }

    return {
        "status": "success",
        "model": result["model"],
        "input_type": result["input_type"],
        "analysis": str(
            output_dir / "analysis.json"
        ),
        "report": str(
            output_dir / "report.md"
        ),
        "segmentation_zip": (
            str(segmentation_zip)
            if segmentation_zip
            else None
        ),
        "previews": previews,
    }