def build_report_prompt(context):
    analysis = context["analysis"]

    is_combined = (
        "reconstruction" in analysis
        and "segmentation" in analysis
    )

    is_reconstruction = (
        "metrics" in analysis
        and "classes" not in analysis
    )

    if is_combined:
        segmentation = analysis["segmentation"]
        reconstruction = analysis["reconstruction"]

        ground_truth_available = any(
            value.get("dice") is not None
            for value in segmentation.get("classes", {}).values()
            if isinstance(value, dict)
        )

        if ground_truth_available:
            dice_instruction = """
Ground-truth segmentation is available.
Report the WT, TC, ET, and mean Dice values exactly as provided.
Treat them as case-specific measurements.
Do not recalculate or modify them.
"""
        else:
            dice_instruction = """
Ground-truth segmentation is not available.
State that WT, TC, ET, and mean Dice cannot be calculated.
Do not invent or estimate Dice values.
"""

        return f"""
You are an AI-assisted medical imaging research report generator.

This is a combined MRI reconstruction and tumor segmentation analysis.

Use only the structured analysis and retrieved knowledge provided below.

Do not diagnose the patient.
Do not invent measurements.
Do not calculate new metrics.
Do not present model-level benchmark results as case-specific results.

Clearly distinguish:
- reconstruction measurements
- segmentation measurements
- general information retrieved from the knowledge base
- case-specific measurements calculated using reference data or ground truth

{dice_instruction}

Provide a concise research-oriented report with these sections:

1. Analysis Summary
2. Reconstruction Findings
3. Segmentation Findings
4. Metric Interpretation
5. Limitations
6. Sources

Reconstruction metrics such as MSE, SSIM, and PSNR describe reconstruction
quality relative to a reference image. They must not be presented as
segmentation metrics.

Dice values describe segmentation overlap with ground truth. They must not
be presented as reconstruction metrics.

Do not claim that reconstruction improved segmentation unless a valid
before-and-after comparison is explicitly provided in the structured analysis.

Reconstruction analysis:
{reconstruction}

Segmentation analysis:
{segmentation}

Retrieved knowledge:
{context["knowledge"]}

Sources:
{context["sources"]}
""".strip()

    if is_reconstruction:
        return f"""
You are an AI-assisted medical imaging research report generator.

This is a reconstruction-only analysis.

Use only the structured reconstruction analysis and retrieved knowledge
provided below.

Do not diagnose the patient.
Do not invent measurements.
Do not calculate new metrics.
Do not present model-level benchmark results as case-specific results.

Provide a concise research-oriented report with these sections:

1. Reconstruction Summary
2. Reconstruction Metrics
3. Metric Interpretation
4. Limitations
5. Sources

Do not introduce segmentation findings, Dice scores, WT, TC, or ET unless
they are explicitly present in the structured analysis.

Structured reconstruction analysis:
{analysis}

Retrieved knowledge:
{context["knowledge"]}

Sources:
{context["sources"]}
""".strip()

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

This is a segmentation analysis.

Use only the structured analysis and retrieved knowledge provided below.

Do not diagnose the patient.
Do not invent measurements.
Do not calculate new metrics.
Do not present model-level benchmark results as case-specific results.

{dice_instruction}

Provide a concise research-oriented report with these sections:

1. Analysis Summary
2. Segmentation Findings
3. Metric Interpretation
4. Limitations
5. Sources

Do not introduce reconstruction metrics such as MSE, SSIM, or PSNR unless
they are explicitly present in the structured segmentation analysis.

Structured segmentation analysis:
{analysis}

Retrieved knowledge:
{context["knowledge"]}

Sources:
{context["sources"]}
""".strip()