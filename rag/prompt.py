def build_report_prompt(context):
    analysis = context["analysis"]

    reconstruction = analysis.get(
        "reconstruction",
        "Reconstruction analysis is not available for this case."
    )

    segmentation = analysis.get(
        "segmentation",
        analysis
    )

    ground_truth_available = any(
        value.get("dice") is not None
        for value in analysis.get("classes", {}).values()
        if isinstance(value, dict)
    )

    if ground_truth_available:
        dice_instruction = """
Ground-truth segmentation is available for this case.
Report the calculated WT, TC, ET, and mean Dice values exactly as provided.
Treat these as case-specific measurements.
Do not recalculate or modify them.
"""
    else:
        dice_instruction = """
Ground-truth segmentation is not available for this case.
State that WT, TC, ET, and mean Dice cannot be calculated for this case.
Do not invent or estimate Dice values.
"""

    return f"""
You are an AI-assisted medical imaging research report generator.

Use only the structured analysis and retrieved knowledge provided below.

Do not diagnose the patient.
Do not invent measurements.
Do not calculate new metrics.
Do not present model-level benchmark results as case-specific results.

Clearly distinguish:
- observations directly calculated from the current model output
- general information retrieved from the knowledge base
- case-specific metrics calculated using ground truth
- metrics that cannot be calculated because ground truth or reference data is unavailable

{dice_instruction}

Provide a concise research-oriented report with these sections:

1. Analysis Summary
2. Reconstruction Findings
3. Segmentation Findings
4. Metric Interpretation
5. Limitations
6. Sources

Reconstruction analysis:
{reconstruction}

Segmentation analysis:
{segmentation}

Retrieved knowledge:
{context["knowledge"]}

Sources:
{context["sources"]}
""".strip()