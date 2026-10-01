# AI Analysis & RAG Integration Guide

## 1. Overview

This component provides the AI analysis and knowledge/report-generation layer for **NeuroVisionAI**.

Its purpose is to take an MRI case, run the configured segmentation model, analyze the resulting segmentation, optionally evaluate it against available ground truth, retrieve relevant medical-imaging knowledge through RAG, and generate an AI-assisted research report.

The application layer should not need to know how the segmentation models, preprocessing, analysis, RAG, or LLM are implemented internally.

The main integration entry point is:

```python
from pipeline import run_pipeline

result = run_pipeline(
    input_path="path/to/mri_case",
    output_dir="path/to/output",
    model_name="unimatch",
)
```

---

## 2. MVP

The current MVP provides:

* MRI case input through NIfTI, DICOM, or ZIP input
* Four-modality MRI preprocessing:

  * FLAIR
  * T1
  * T1ce
  * T2
* Two supported segmentation models:

  * UniMatch
  * iPixMatch
* WT / TC / ET segmentation analysis
* Pixel-level and slice-level statistics
* Ground-truth detection when a BraTS-style `-seg.nii` file is present
* Case-specific Dice calculation:

  * WT
  * TC
  * ET
  * Mean Dice
* Segmentation visualization
* Class-specific preview images
* Segmentation overlay ZIP
* Structured `analysis.json`
* RAG-based knowledge retrieval
* Gemini-based AI-assisted report generation
* Deterministic fallback report when the LLM is unavailable
* A stable callable interface for backend integration

The system is designed as a **research-oriented analysis pipeline** and does not provide medical diagnosis.

---

## 3. Overall Flow

```text
                         MRI CASE
                            │
                            ▼
                  ┌───────────────────┐
                  │ Input Preparation │
                  │ NIfTI / DICOM /   │
                  │ ZIP                │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │   Preprocessing   │
                  │ Modality detection│
                  │ Normalization      │
                  │ Validation         │
                  └─────────┬─────────┘
                            │
                            ▼
                ┌─────────────────────────┐
                │ Segmentation Model      │
                │                         │
                │ UniMatch / iPixMatch    │
                └────────────┬────────────┘
                             │
                             ▼
                  ┌───────────────────┐
                  │ Segmentation      │
                  │ Analysis          │
                  │                   │
                  │ WT / TC / ET      │
                  │ Pixels            │
                  │ Slices            │
                  │ Probabilities     │
                  └─────────┬─────────┘
                            │
                 Ground Truth Available?
                       │             │
                      Yes            No
                       │             │
                       ▼             ▼
                 ┌────────────┐   Dice unavailable
                 │ Dice       │
                 │ WT / TC /  │
                 │ ET / Mean  │
                 └─────┬──────┘
                       │
                       └───────┬───────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │ Structured Analysis│
                    │    analysis.json   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │        RAG         │
                    │                    │
                    │ Retrieve relevant  │
                    │ medical-imaging    │
                    │ knowledge          │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │       LLM          │
                    │                    │
                    │ Gemini report      │
                    │ generation        │
                    └─────────┬──────────┘
                              │
                     LLM unavailable?
                         │           │
                        No          Yes
                         │           │
                         ▼           ▼
                   AI report    Deterministic
                                fallback report
                         │           │
                         └─────┬─────┘
                               │
                               ▼
                         report.md
```

---

## 4. Repository Responsibilities

The relevant directories are:

```text
NeuroVisionAI/
│
├── models/
│   ├── reconstruction/
│   └── segmentation/
│
├── preprocessing/
│
├── analysis/
│
├── rag/
│
├── services/
│
├── docs/
│
├── input/
│
├── output/
│
├── pipeline.py
├── run_pipeline.py
├── requirements.txt
└── .env
```

### `models/`

Contains the existing ML model inference implementations and checkpoints.

Backend developers should not need to interact with this directory directly.

### `preprocessing/`

Handles:

* case detection
* input extraction
* MRI modality identification
* normalization
* NIfTI loading
* DICOM handling
* input validation
* optional ground-truth detection

### `analysis/`

Handles:

* WT / TC / ET analysis
* pixel counts
* affected slices
* maximum-prediction slices
* probability statistics
* Dice calculation when ground truth exists
* visualization
* segmentation output packaging

### `rag/`

Handles:

* knowledge-base documents
* embeddings
* vector search
* retrieved context
* report prompting
* Gemini integration
* deterministic fallback report

### `services/`

Provides the higher-level case-processing service connecting preprocessing, ML inference, analysis, and report generation.

### `pipeline.py`

Provides the main callable integration interface.

### `run_pipeline.py`

Provides the command-line entry point for testing and running the complete pipeline.

---

# 5. Environment Setup

## 5.1 Requirements

Recommended environment:

```text
Python 3.11
```

The project uses PyTorch and the existing ML dependencies.

A CUDA-compatible GPU is recommended for segmentation inference.

CPU execution may be considerably slower depending on the model and input.

---

## 5.2 Create Virtual Environment

From the project root:

```cmd
python -m venv .venv
```

Activate it on Windows:

```cmd
.venv\Scripts\activate
```

Verify:

```cmd
python --version
```

Expected:

```text
Python 3.11.x
```

---

## 5.3 Install Dependencies

Install the project dependencies:

```cmd
pip install -r requirements.txt
```

If the environment contains additional ML dependencies required by the existing model implementation, install those as specified by the project environment.

The current environment includes packages for:

```text
PyTorch
diffusers
numpy
Pillow
scikit-image
h5py
opencv-python
nibabel
pydicom
python-dotenv
sentence-transformers
faiss-cpu
google-genai
```

---

# 6. Environment Variables

Create a local `.env` file in the project root.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do not commit the actual `.env` file.

The repository contains `.env.example` for configuration reference.

The Gemini API key is used only for AI-assisted report generation.

If Gemini is unavailable because of quota, network, or service issues, the pipeline automatically generates a deterministic fallback report from the structured analysis.

---

# 7. Model Checkpoints

The segmentation checkpoints are expected at:

```text
models/segmentation/best_unimatch.pth
models/segmentation/chunk3_best_ipixmatch.pth
```

The pipeline maps them automatically:

```text
unimatch
    ↓
models/segmentation/best_unimatch.pth

ipixmatch
    ↓
models/segmentation/chunk3_best_ipixmatch.pth
```

The backend does not need to load these checkpoints directly.

---

# 8. Supported Segmentation Models

## UniMatch

Run using:

```cmd
python run_pipeline.py --input <input> --output <output> --model unimatch
```

## iPixMatch

Run using:

```cmd
python run_pipeline.py --input <input> --output <output> --model ipixmatch
```

If `--model` is omitted:

```text
unimatch
```

is used as the default.

The models share the same external pipeline contract.

---

# 9. Input Requirements

The segmentation pipeline expects four MRI modalities:

```text
FLAIR
T1
T1ce
T2
```

For BraTS-style NIfTI input, the modality naming convention is mapped automatically.

A typical case contains:

```text
case/
├── case-t1c.nii
├── case-t1n.nii
├── case-t2f.nii
├── case-t2w.nii
└── case-seg.nii
```

The `-seg.nii` file is optional.

If it is present, it is treated as ground truth and used for case-level Dice evaluation.

If it is absent, segmentation still runs normally, but Dice cannot be calculated.

---

# 10. Sample Test Case

A sample MRI case is already included in:

```text
input/BraTS-GLI-00005-100
```

This case is included in the repository for testing the complete pipeline.

It contains the four MRI modalities and a segmentation ground-truth file.

Therefore it can be used to test:

* preprocessing
* segmentation
* WT / TC / ET analysis
* ground-truth evaluation
* Dice calculation
* visualization
* RAG
* report generation
* output packaging
* integration contract

---

# 11. Run the Complete Pipeline

From the project root:

```cmd
python run_pipeline.py --input input\BraTS-GLI-00005-100 --output output\test --model unimatch
```

For iPixMatch:

```cmd
python run_pipeline.py --input input\BraTS-GLI-00005-100 --output output\test_ipixmatch --model ipixmatch
```

Expected console output:

```text
Pipeline completed successfully.
Model: unimatch
Report: output\test\report.md
```

or:

```text
Pipeline completed successfully.
Model: ipixmatch
Report: output\test_ipixmatch\report.md
```

---

# 12. Expected Output

A successful NIfTI run produces:

```text
output/
└── test/
    ├── analysis.json
    ├── report.md
    ├── segmentation_overlays.zip
    └── previews/
        ├── WT.png
        ├── TC.png
        ├── ET.png
        └── previews.json
```

## `analysis.json`

Contains the structured machine-readable analysis.

Example structure:

```json
{
    "volume": "nifti_case",
    "model": "ipixmatch",
    "slice_count": 182,
    "classes": {
        "WT": {
            "predicted_pixels": 27238,
            "ground_truth_pixels": 39570,
            "affected_slices": 48,
            "max_slice": 30,
            "max_slice_pixels": 19322,
            "mean_probability": 0.0030,
            "max_probability": 0.9928,
            "dice": 0.1766
        },
        "TC": {
            "predicted_pixels": 25847,
            "ground_truth_pixels": 6245,
            "affected_slices": 98,
            "max_slice": 113,
            "max_slice_pixels": 954,
            "mean_probability": 0.0027,
            "max_probability": 0.9995,
            "dice": 0.0123
        },
        "ET": {
            "predicted_pixels": 170,
            "ground_truth_pixels": 6245,
            "affected_slices": 15,
            "max_slice": 40,
            "max_slice_pixels": 22,
            "mean_probability": 0.0003,
            "max_probability": 0.9939,
            "dice": 0.0
        }
    },
    "mean_dice": 0.0630
}
```

The exact values depend on the model and test case.

---

# 13. Understanding WT, TC and ET

The segmentation output contains three regions:

```text
WT = Whole Tumor
TC = Tumor Core
ET = Enhancing Tumor
```

The analysis layer reports these independently.

For each class, the analysis contains:

```text
predicted_pixels
ground_truth_pixels
affected_slices
max_slice
max_slice_pixels
mean_probability
max_probability
dice
```

These are calculated from the model output and, when available, the ground-truth segmentation.

---

# 14. Dice Evaluation

Dice is calculated only when ground truth is available.

The analysis layer calculates:

```text
WT Dice
TC Dice
ET Dice
Mean Dice
```

Without ground truth:

```text
dice = null
mean_dice = null
```

This distinction is important.

The system does not estimate or fabricate a Dice score when a reference segmentation is unavailable.

---

# 15. Segmentation Visualization

The pipeline creates:

```text
previews/
├── WT.png
├── TC.png
└── ET.png
```

Each preview shows the relevant segmentation region over the MRI slice containing the maximum number of predicted pixels for that class.

The complete slice-level overlays are stored in:

```text
segmentation_overlays.zip
```

This allows developers to inspect the model output visually without accessing internal model code.

---

# 16. RAG Pipeline

The RAG layer provides contextual knowledge to the report-generation system.

The flow is:

```text
Structured Analysis
        │
        ▼
Knowledge Query
        │
        ▼
Embedding Model
        │
        ▼
Vector Search
        │
        ▼
Relevant Documents
        │
        ▼
Report Context
```

The knowledge base currently contains material covering topics such as:

```text
MRI reconstruction
brain tumor segmentation
segmentation metrics
project limitations
```

The retrieved knowledge is passed to the report-generation prompt together with the structured analysis.

RAG is used as a **knowledge/explanation layer**.

It does not perform the actual MRI segmentation or calculate the core metrics.

---

# 17. AI Report Generation

The report-generation flow is:

```text
Structured Analysis
        +
Retrieved Knowledge
        │
        ▼
Report Prompt
        │
        ▼
Gemini
        │
        ▼
report.md
```

The report is instructed to distinguish between:

* observations calculated from the current case
* general retrieved knowledge
* case-specific metrics
* unavailable metrics
* project/model-level benchmark results
* limitations

The LLM is not responsible for calculating the core measurements.

---

# 18. Gemini Failure / Fallback

Gemini is an external service and may be unavailable because of:

* quota limits
* API errors
* network issues
* service availability

The pipeline does not fail solely because report generation is unavailable.

Instead, it generates a deterministic fallback report from the structured analysis.

The fallback report contains:

* model used
* slice count
* WT analysis
* TC analysis
* ET analysis
* Dice values when available
* mean Dice
* limitations
* report-generation status

This allows the backend to continue receiving a valid report even when the external LLM is unavailable.

---

# 19. Medical Safety Boundary

The generated report is an **AI-assisted research report**.

It is not a medical diagnosis.

The system should not be presented as determining:

* whether a patient has cancer
* tumor grade
* treatment
* prognosis
* clinical diagnosis

The segmentation outputs and calculated measurements should be interpreted as model/research outputs.

---

# 20. Model Benchmark vs Case Metrics

The project also contains model-level experimental benchmark results.

These must not be confused with measurements from the current MRI case.

For example:

```text
Model benchmark
    ↓
reported during model evaluation

Case metric
    ↓
calculated from the current input and available ground truth
```

The report-generation prompt explicitly instructs the LLM not to present model-level benchmark results as case-specific results.

---

# 21. Backend Integration

Backend developers should use only the public pipeline function:

```python
from pipeline import run_pipeline
```

Example:

```python
result = run_pipeline(
    input_path="input/BraTS-GLI-00005-100",
    output_dir="output/backend_case",
    model_name="unimatch",
)
```

The backend does not need to:

* load PyTorch models
* load checkpoints
* normalize MRI images
* identify MRI modalities
* perform segmentation
* calculate Dice
* query FAISS
* construct RAG prompts
* call Gemini
* generate segmentation overlays

All of these are handled internally.

---

# 22. Integration Return Contract

A successful pipeline call returns:

```python
{
    "status": "success",
    "model": "unimatch",
    "input_type": "nifti",
    "analysis": "output/backend_case/analysis.json",
    "report": "output/backend_case/report.md",
    "segmentation_zip": "output/backend_case/segmentation_overlays.zip",
    "previews": {
        "WT": "output/backend_case/previews/WT.png",
        "TC": "output/backend_case/previews/TC.png",
        "ET": "output/backend_case/previews/ET.png",
        "metadata": "output/backend_case/previews/previews.json"
    }
}
```

### Return fields

| Field              | Meaning                                 |
| ------------------ | --------------------------------------- |
| `status`           | Pipeline execution status               |
| `model`            | Segmentation model used                 |
| `input_type`       | Detected input type                     |
| `analysis`         | Path to structured analysis JSON        |
| `report`           | Path to generated report                |
| `segmentation_zip` | Path to complete segmentation overlays  |
| `previews`         | Paths to WT/TC/ET previews and metadata |

---

# 23. Recommended Backend Usage

The backend can expose these results through its own API.

For example:

```python
result = run_pipeline(
    input_path=uploaded_case,
    output_dir=case_output_directory,
    model_name="unimatch",
)
```

Then use:

```python
result["analysis"]
```

for structured analysis,

```python
result["report"]
```

for the research report,

and:

```python
result["previews"]
```

for displaying WT/TC/ET previews.

The backend can provide download access to:

```python
result["segmentation_zip"]
```

without knowing how the ZIP was generated.

---

# 24. CLI Usage

The command-line wrapper is:

```text
run_pipeline.py
```

Usage:

```cmd
python run_pipeline.py --input <input> --output <output> --model <model>
```

Arguments:

```text
--input
    Input MRI case, directory, or ZIP.

--output
    Output directory.

--model
    unimatch or ipixmatch.
    Default: unimatch.
```

Examples:

```cmd
python run_pipeline.py --input input\BraTS-GLI-00005-100 --output output\unimatch_test --model unimatch
```

```cmd
python run_pipeline.py --input input\BraTS-GLI-00005-100 --output output\ipixmatch_test --model ipixmatch
```

---

# 25. Testing the Pipeline

## Test 1 — UniMatch

```cmd
python run_pipeline.py --input input\BraTS-GLI-00005-100 --output output\test_unimatch --model unimatch
```

Check:

```cmd
dir output\test_unimatch
```

Expected:

```text
analysis.json
report.md
segmentation_overlays.zip
previews
```

Then:

```cmd
dir output\test_unimatch\previews
```

Expected:

```text
WT.png
TC.png
ET.png
previews.json
```

Read the analysis:

```cmd
type output\test_unimatch\analysis.json
```

Read the report:

```cmd
type output\test_unimatch\report.md
```

---

## Test 2 — iPixMatch

```cmd
python run_pipeline.py --input input\BraTS-GLI-00005-100 --output output\test_ipixmatch --model ipixmatch
```

Then:

```cmd
type output\test_ipixmatch\analysis.json
```

and:

```cmd
type output\test_ipixmatch\report.md
```

---

# 26. Testing Without Ground Truth

To test a normal case where ground truth is unavailable, provide an MRI case containing the required modalities but no `-seg.nii`.

The pipeline should still produce:

```text
analysis.json
report.md
previews/
segmentation_overlays.zip
```

but:

```json
"dice": null
```

and:

```json
"mean_dice": null
```

The report should state that Dice cannot be calculated because ground truth is unavailable.

---

# 27. Error Testing

## Missing input

```cmd
python -c "from services.case_service import run_case; run_case('input\does_not_exist','unimatch')"
```

Expected:

```text
FileNotFoundError: Input case not found
```

## Invalid model

```cmd
python -c "from services.case_service import run_case; run_case('input\BraTS-GLI-00005-100','invalid_model')"
```

Expected:

```text
ValueError: Unsupported segmentation model
```

## Incomplete MRI

An incomplete DICOM case should produce an error identifying the missing modalities, for example:

```text
ValueError: Incomplete DICOM MRI case. Missing modalities: FLAIR, T1ce
```

These errors should be caught by the backend and converted into appropriate API responses.

---

# 28. Programmatic Integration Test

Developers can test the callable interface directly:

```python
from pipeline import run_pipeline

result = run_pipeline(
    input_path="input/BraTS-GLI-00005-100",
    output_dir="output/integration_test",
    model_name="unimatch",
)

print(result)
```

The result should contain:

```text
status
model
input_type
analysis
report
segmentation_zip
previews
```

This is the primary integration contract.

---

# 29. End-to-End Data Flow

The complete implementation can be understood as five layers:

```text
1. INPUT
   MRI case
      ↓

2. ML
   Preprocessing
      ↓
   UniMatch / iPixMatch
      ↓
   Segmentation masks
      ↓

3. ANALYSIS
   WT / TC / ET
   Pixel statistics
   Slice statistics
   Probability statistics
   Dice when ground truth exists
      ↓

4. KNOWLEDGE + AI
   RAG retrieval
      ↓
   Structured context
      ↓
   Gemini / fallback
      ↓

5. OUTPUT
   analysis.json
   report.md
   previews
   segmentation_overlays.zip
```

---

# 30. Responsibility Boundary

The AI analysis and RAG pipeline owns:

```text
MRI preprocessing
Segmentation inference
Segmentation analysis
Ground-truth evaluation
Visualization
RAG retrieval
AI report generation
Output packaging
```

The application/backend layer owns:

```text
File upload
API endpoints
Authentication
User/session management
Database
Serving generated files
Frontend integration
```

The frontend should consume the generated output rather than directly interacting with ML/RAG internals.

---

# 31. Current Supported Output

For a successful case, the main user-facing artifacts are:

```text
analysis.json
    ↓
machine-readable measurements

report.md
    ↓
human-readable AI-assisted research report

previews/WT.png
previews/TC.png
previews/ET.png
    ↓
visual segmentation results

segmentation_overlays.zip
    ↓
complete slice-level segmentation output
```

These outputs provide the integration boundary between the AI analysis system and the rest of the application.

---

# 32. Important Limitations

* Segmentation quality depends on the trained model and input compatibility.
* Dice requires a reference segmentation.
* Case-specific Dice should not be confused with model benchmark results.
* Reconstruction analysis is not automatically part of the standard patient segmentation flow.
* The current reconstruction model was trained around motion-corrupted/clean FLAIR reconstruction and should therefore be treated as a separate research/demo workflow unless a validated unified reconstruction-segmentation experiment is established.
* RAG provides contextual knowledge; it does not perform the underlying image analysis.
* Gemini is an external dependency and may be unavailable due to quota or service issues.
* The deterministic fallback report is provided to keep the pipeline operational when LLM generation is unavailable.
* The system is a research-oriented AI analysis pipeline and should not be interpreted as a clinical diagnostic system.

---

# 33. Quick Start

For a developer who only wants to test the existing implementation:

```cmd
git clone <repository-url>
cd NeuroVisionAI

python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt
```

Configure:

```text
.env
```

with:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Make sure the model checkpoints are available under:

```text
models/segmentation/
```

Then run the included sample case:

```cmd
python run_pipeline.py --input input\BraTS-GLI-00005-100 --output output\demo --model unimatch
```

Open:

```text
output/demo/analysis.json
output/demo/report.md
output/demo/previews/WT.png
output/demo/previews/TC.png
output/demo/previews/ET.png
output/demo/segmentation_overlays.zip
```

To test the second segmentation model:

```cmd
python run_pipeline.py --input input\BraTS-GLI-00005-100 --output output/demo_ipixmatch --model ipixmatch
```

For application integration, use:

```python
from pipeline import run_pipeline
```

and consume the returned contract described above.
