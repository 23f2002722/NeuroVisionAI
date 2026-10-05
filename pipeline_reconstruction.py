import argparse
import json
from pathlib import Path

from services.reconstruction_service import run_reconstruction_case
from rag.service import generate_reconstruction_report


def run_pipeline(input_path, output_dir):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    result = run_reconstruction_case(
        input_path=input_path,
        output_dir=output_dir,
    )
    report = generate_reconstruction_report(
    result["analysis"]
)

    analysis = result["analysis"]

    with open(
        output_dir / "reconstruction_analysis.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            analysis,
            file,
            indent=2,
        )
    with open(
    output_dir / "report.md",
    "w",
    encoding="utf-8",
    ) as file:
        file.write(report["report"])

    return {
    "status": "success",
    "model": result["model"],
    "input_type": result["input_type"],
    "output": result["output"],
    "analysis": str(
        output_dir / "reconstruction_analysis.json"
    ),
    "report": str(
        output_dir / "report.md"
    ),
    "sources": report["sources"],
    "previews": result["previews"],
}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--input",
        required=True,
    )

    parser.add_argument(
        "--output",
        required=True,
    )

    args = parser.parse_args()

    result = run_pipeline(
        input_path=args.input,
        output_dir=args.output,
    )

    print("Reconstruction pipeline completed.")
    print("Model:", result["model"])
    print("Input type:", result["input_type"])
    print("Output:", result["output"])
    print("Analysis:", result["analysis"])