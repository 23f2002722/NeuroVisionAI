def build_report_prompt(context):
    analysis = context["analysis"]

    reconstruction = analysis.get("reconstruction")
    segmentation = analysis.get("segmentation", analysis)

    classes = segmentation.get("classes", {})

    ground_truth_available = any(
        isinstance(value, dict) and value.get("dice") is not None
        for value in classes.values()
    )

    if ground_truth_available:
        reliability_instruction = """
A reference segmentation is available for this case.

Use the supplied Dice values exactly as provided.

Explain Dice as a measure of overlap between the AI segmentation and
the available reference segmentation.

If the Dice values are low, explicitly state that the AI output showed
limited agreement with the reference in this case.

Do not interpret Dice as disease severity.

Do not convert Dice into a clinical confidence score.
"""
    else:
        reliability_instruction = """
No reference segmentation is available for this case.

Do not calculate, estimate, or invent Dice values.

State that case-level segmentation agreement could not be evaluated
because a reference segmentation was unavailable.
"""

    if reconstruction:
        reconstruction_section = f"""
## RECONSTRUCTION ANALYSIS

{reconstruction}

Include reconstruction findings in the report.

Explain reconstruction results in patient-friendly language first.
Place MSE, SSIM, PSNR, and other technical measurements in the
Technical Appendix.

Do not claim that reconstruction improved segmentation unless the
provided analysis contains an actual before-versus-after comparison.
"""
    else:
        reconstruction_section = """
## RECONSTRUCTION ANALYSIS

No reconstruction was performed for this case.

Do not create a reconstruction section in the patient-facing report.
Do not mention reconstruction unless necessary to explain that it was
not part of this analysis.
"""

    return f"""
You are generating the final healthcare-style AI-assisted MRI report
for NeuroVisionAI.

Your job is NOT simply to rewrite model statistics.

Your job is to transform the structured AI analysis into a clear,
professional, patient-understandable imaging report while preserving
the scientific limitations of the underlying AI system.

The report must distinguish between:

1. What the AI model generated from the current MRI.
2. What can be evaluated against a reference segmentation.
3. General medical/imaging information obtained from the knowledge base.
4. Research benchmark results from model evaluation.
5. Clinical conclusions that cannot be established by this system.

Use ONLY the structured analysis and retrieved knowledge provided below.

Do not invent patient information, symptoms, history, measurements,
anatomical locations, diagnoses, tumor grades, treatment plans,
prognosis, or clinical findings.

Do not diagnose the patient.

Do not state that the patient definitely has a tumor.

Do not state that the patient definitely does not have a tumor.

Do not state that the patient has cancer.

Do not state that a region is malignant.

Do not infer tumor grade, prognosis, treatment, or disease severity.

WT, TC, and ET are model-defined segmentation categories.

Explain these categories as categories produced by the AI model, not as
independently confirmed diagnoses.

Do not describe Enhancing Tumor (ET) as proof of active tumor growth.

If the AI generates a segmentation region, describe it as:

"The AI model generated a region in its [category] segmentation."

Do NOT write:

"The patient has a tumor."

If the model generates no meaningful segmentation, state that the AI
did not generate a meaningful region in that model-defined category.

Do NOT interpret absence of segmentation as proof that no tumor exists.

{reliability_instruction}

## REPORT OBJECTIVE

The patient should be able to understand the main result within the
first few sections.

The report should answer:

- What was analyzed?
- What did the AI identify?
- How reliable was the AI output for this particular case?
- What does the result mean?
- What can the AI NOT determine?
- What should the patient discuss with a qualified doctor?

The report should feel like a professional AI-assisted medical imaging
report, not like a machine-learning experiment log.

Use concise paragraphs and clear bullet points.

Avoid unnecessary technical terminology in the patient-facing sections.

Technical measurements belong in the Technical Appendix.

Do not mention prompts, LLMs, RAG, or internal software implementation.

---

# AI-ASSISTED MRI REPORT

## 1. EXAMINATION SUMMARY

Briefly describe:

- the MRI analysis performed;
- the available modalities, only if actually known from the analysis;
- the segmentation model used;
- whether reconstruction was performed;
- whether a reference segmentation was available.

Do not assume that a modality was present merely because the training
dataset normally contains it.

End with:

"This is an AI-assisted research analysis and is not a medical diagnosis."

---

## 2. AI IMPRESSION

This is the most important section of the report.

Summarize the main result in approximately 2–4 clear sentences.

State what the AI actually identified in the current case.

If the model generated meaningful WT, TC, or ET segmentation regions,
state that clearly.

For example:

"The AI model generated regions within its Whole Tumor, Tumor Core,
and Enhancing Tumor segmentation categories."

Then immediately explain the reliability of the result if reference
comparison is available.

If case-level agreement is poor, say so clearly.

For example:

"Comparison with the available reference segmentation showed limited
agreement in this case. The result should therefore be interpreted as
a research output rather than a reliable clinical interpretation."

Do not hide important reliability information.

Do not place raw pixel counts in this section.

---

## 3. WHAT THE AI IDENTIFIED

Describe the model-defined categories in patient-friendly language.

### Whole Tumor (WT)

Explain that WT is the model's category representing the overall
tumor-related region it was trained to segment.

State whether the current model generated a WT segmentation region.

Do not call this a confirmed tumor.

### Tumor Core (TC)

Explain that TC is the model's category representing the
tumor-core region it was trained to segment.

State whether the current model generated a TC segmentation region.

Do not make a clinical diagnosis.

### Enhancing Tumor (ET)

Explain that ET is the model's category representing an enhancing
region used by the segmentation model.

State whether the current model generated an ET segmentation region.

Do not describe this as proof of active tumor growth, malignancy,
or cancer.

Do not include raw pixel counts or probability values here.

---

## 4. WHAT DOES THIS MEAN?

Explain the AI result in ordinary language.

Answer:

- What did the AI highlight?
- What do the highlighted categories represent?
- What can the result tell us?
- What can the result NOT tell us?

Clearly explain:

"The AI has identified patterns that fall within the categories it
was trained to segment. This finding alone does not establish whether
the patient has a tumor."

If reference comparison is available, explain whether the current
segmentation showed strong, moderate, or limited agreement based only
on the supplied Dice values.

If agreement is poor, make that limitation prominent.

Do not interpret poor segmentation agreement as absence of disease.

Do not interpret poor segmentation agreement as disease severity.

Do not interpret model probability values as clinical confidence.

---

## 5. RELIABILITY OF THIS AI ANALYSIS

Provide a clear case-specific assessment based ONLY on the available
evidence.

If reference segmentation exists:

- report the supplied WT, TC, ET, and mean Dice values;
- explain that these measure segmentation overlap;
- clearly describe limited agreement if the values are low.

If reference segmentation does not exist:

- state that case-level segmentation accuracy cannot be evaluated;
- do not invent a confidence score.

Never claim clinical validation.

Never use model probability as patient-level confidence.

If the case-level evidence indicates poor agreement, explicitly state:

"The current AI segmentation should be treated as a research output
rather than a reliable clinical interpretation."

---

## 6. QUESTIONS TO DISCUSS WITH YOUR DOCTOR

Provide 3–5 practical questions relevant to the AI findings.

Prefer questions such as:

- What do the regions highlighted on my MRI represent?
- Does the radiologist's interpretation agree with the AI-generated
  regions?
- Are the highlighted regions clinically significant in my case?
- How should the AI-generated segmentation be interpreted together with
  the original MRI and clinical history?
- Is any additional evaluation appropriate based on the complete
  clinical picture?

Do not recommend a specific treatment.

Do not state that additional testing is necessary.

---

## 7. IMPORTANT LIMITATIONS

Clearly explain the important limitations relevant to this case.

Include, where applicable:

- this is an AI-assisted research analysis;
- it is not a medical diagnosis;
- the segmentation model was developed/evaluated using research data;
- performance may vary with image quality, acquisition protocol,
  preprocessing, and input compatibility;
- Dice requires a reference segmentation;
- model-level benchmark results do not guarantee performance on an
  individual case;
- the AI cannot determine tumor grade, prognosis, treatment, or cancer
  status from segmentation output alone;
- clinical interpretation requires the original MRI, clinical history,
  and qualified medical professionals.

Keep this section factual and non-alarming.

---

## 8. TECHNICAL APPENDIX

This section is intended for researchers, developers, and technically
interested users.

Clearly label these as technical/model measurements and NOT medical
measurements.

Include, when available:

### General

- segmentation model;
- number of slices;
- input type.

### Whole Tumor (WT)

- predicted pixels;
- affected slices;
- maximum predicted slice;
- maximum predicted pixels;
- mean probability;
- maximum probability;
- Dice.

### Tumor Core (TC)

- predicted pixels;
- affected slices;
- maximum predicted slice;
- maximum predicted pixels;
- mean probability;
- maximum probability;
- Dice.

### Enhancing Tumor (ET)

- predicted pixels;
- affected slices;
- maximum predicted slice;
- maximum predicted pixels;
- mean probability;
- maximum probability;
- Dice.

### Case-Level Segmentation Evaluation

If ground truth exists:

- WT Dice;
- TC Dice;
- ET Dice;
- mean Dice.

If ground truth does not exist:

"Case-level Dice could not be calculated because a reference
segmentation was unavailable."

Round technical values sensibly.

Do not output unnecessarily long decimal values.

For example:

0.063 rather than 0.06318492837291.

---

## 9. RESEARCH BENCHMARK CONTEXT

Only include this section when model-level benchmark results are
actually supplied in the analysis or retrieved knowledge.

Clearly label the numbers as:

"Research benchmark results from model evaluation; these are NOT the
results of this individual MRI case."

Do not compare the patient's case to the benchmark in a way that
suggests the benchmark predicts the patient's outcome.

Do not use benchmark values as evidence that this individual case is
reliable.

---

## 10. RECONSTRUCTION FINDINGS

{reconstruction_section}

If reconstruction was not performed, omit this section entirely from
the final patient-facing report.

If reconstruction was performed:

- explain the reconstruction result in simple language;
- state whether a clean reference was available;
- only report MSE, SSIM, and PSNR if supplied;
- do not claim that reconstruction improved segmentation unless an
  actual before/after comparison is available.

---

## SOURCE HANDLING

Use the retrieved knowledge only for general explanations and
methodological context.

Do not use retrieved knowledge to invent patient-specific findings.

At the end, provide a concise References section containing the
retrieved source titles.

Do not invent URLs or citations.

---

## STRUCTURED ANALYSIS

{segmentation}

## RECONSTRUCTION DATA

{reconstruction if reconstruction else "No reconstruction analysis was performed."}

## RETRIEVED KNOWLEDGE

{context["knowledge"]}

## SOURCES

{context["sources"]}
""".strip()