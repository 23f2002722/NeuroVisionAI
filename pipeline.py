from pathlib import Path
import json

from services.case_service import run_case


def run_pipeline(input_path, output_dir, model_name="unimatch"):
    input_path = Path(input_path)
    output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    result = run_case(
        str(input_path),
        model_name=model_name,
    )

    with open(output_dir / "analysis.json", "w", encoding="utf-8") as file:
        json.dump(result["analysis"], file, indent=2, default=str)

    with open(output_dir / "report.md", "w", encoding="utf-8") as file:
        file.write(result["report"])

    return {
        "status": "success",
        "model": result["model"],
        "analysis": str(output_dir / "analysis.json"),
        "report": str(output_dir / "report.md"),
    }