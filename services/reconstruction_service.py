from analysis.analyze_reconstruction import analyze_reconstruction
from pathlib import Path

from preprocessing.loader import prepare_case, load_prepared_case
from models.reconstruction.service import run_reconstruction_volume


def run_reconstruction_case(
    input_path,
    output_dir,
):
    input_path = Path(input_path)

    if not input_path.exists():
        raise FileNotFoundError(
            f"Input case not found: {input_path}"
        )

    case = prepare_case(input_path)

    volume = load_prepared_case(case)

    flair = volume["image"][0]

    result = run_reconstruction_volume(
        flair_volume=flair,
        output_dir=output_dir,
        affine=volume["affine"],
    )
    reference_path = case["modalities"]["FLAIR"]

    analysis = analyze_reconstruction(
        reference_path=reference_path,
        reconstructed_path=result["output"],
    )

    return {
        "input_type": case["input_type"],
        "model": result["model"],
        "output": result["output"],
        "previews": result["previews"],
        "analysis": analysis,
    }