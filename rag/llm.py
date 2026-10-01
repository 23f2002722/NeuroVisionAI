import os

from dotenv import load_dotenv
from google import genai

from rag.prompt import build_report_prompt


load_dotenv()


def build_fallback_report(analysis):
    classes = analysis.get("classes", {})

    lines = [
        "## AI-Assisted Medical Imaging Research Report",
        "",
        "Gemini report generation was unavailable. "
        "The following report was generated from the structured analysis.",
        "",
        "### 1. Analysis Summary",
        "",
        f"Segmentation analysis was performed using the `{analysis.get('model')}` model "
        f"across {analysis.get('slice_count')} slices.",
        "",
        "### 2. Reconstruction Findings",
        "",
        "Reconstruction analysis is not available for this case.",
        "",
        "### 3. Segmentation Findings",
        "",
    ]

    labels = {
        "WT": "Whole Tumor",
        "TC": "Tumor Core",
        "ET": "Enhancing Tumor",
    }

    for name, label in labels.items():
        value = classes.get(name, {})
        lines.extend([
            f"**{label} ({name})**",
            f"- Predicted pixels: {value.get('predicted_pixels')}",
            f"- Ground-truth pixels: {value.get('ground_truth_pixels')}",
            f"- Affected slices: {value.get('affected_slices')}",
            f"- Maximum predicted pixels: {value.get('max_slice_pixels')} "
            f"on slice {value.get('max_slice')}",
            f"- Mean probability: {value.get('mean_probability'):.4f}",
            f"- Maximum probability: {value.get('max_probability'):.4f}",
            f"- Dice: {value.get('dice')}",
            "",
        ])

    mean_dice = analysis.get("mean_dice")

    lines.extend([
        "### 4. Metric Interpretation",
        "",
        f"Mean Dice: {mean_dice}",
        "",
        "Dice values are case-specific measurements calculated from the "
        "model predictions and available ground-truth segmentation.",
        "",
        "### 5. Limitations",
        "",
        "This report summarizes model output and does not constitute a medical diagnosis.",
        "Reconstruction analysis was not performed for this case.",
        "",
        "### 6. Sources",
        "",
        "The AI-generated report could not be produced because the configured "
        "LLM service was temporarily unavailable.",
    ])

    return "\n".join(lines)


def generate_report(context):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=api_key)
    prompt = build_report_prompt(context)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        return response.text

    except Exception:
        return build_fallback_report(
            context.get("analysis", {})
        )


if __name__ == "__main__":
    print("Gemini client ready.")