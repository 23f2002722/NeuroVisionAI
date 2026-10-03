# NeuroVisionAI Developer Integration

## 1. Purpose

This document defines the technical integration contract between the NeuroVisionAI ML/AI pipeline and the application layer.

Developers should use the exposed pipeline and service interfaces instead of loading models, checkpoints, or RAG components directly.

## 2. System Flows

### Standard Analysis

```text
MRI case → preprocessing → 4-modality volume → UniMatch/iPixMatch
→ WT/TC/ET analysis → RAG + LLM/fallback → outputs
```

### Reconstruction

```text
FLAIR → conditional DDPM → reconstructed FLAIR
→ MSE/SSIM/PSNR → RAG + LLM/fallback
```

### Reconstruction + Analysis

```text
T1 + T1ce + T2 + FLAIR
→ DDPM on FLAIR
→ reconstructed FLAIR
→ segmentation
→ combined analysis
→ RAG + LLM/fallback
```

The current DDPM is a FLAIR reconstruction model trained around clean/motion-corrupted data. Automatic corruption detection is not implemented.

## 3. Repository Interfaces

```text
models/
  reconstruction/       Reconstruction inference
  segmentation/         Segmentation inference
preprocessing/           Input detection and MRI preparation
analysis/                Quantitative analysis and visualization
rag/                     Retrieval and report generation
services/                Workflow orchestration
pipeline.py              Standard analysis entry point
pipeline_reconstruction.py
                         Reconstruction entry point
```

Application code should use these interfaces rather than accessing model internals directly.

## 4. Input Contract

### Segmentation

Required modalities:

```text
FLAIR
T1
T1ce
T2
```

Supported inputs:

```text
NIfTI: .nii / .nii.gz
DICOM: MRI series directory
ZIP: supported NIfTI or DICOM data
```

BraTS-style `*-seg.nii` is optional and is used as ground truth when present.

Arbitrary PNG/JPG slice collections are not treated as final MRI volumes.

### Reconstruction

The current reconstruction workflow operates on the FLAIR volume prepared by the MRI input pipeline.

## 5. Preprocessing Contract

### NIfTI

The four modalities must have compatible spatial dimensions.

Prepared volume:

```text
image.shape = (4, H, W, Z)
```

Channel order:

```text
0 → FLAIR
1 → T1
2 → T1ce
3 → T2
```

The FLAIR affine is retained for reconstructed NIfTI output.

### DICOM

The DICOM pipeline:

1. Detects MRI series.
2. Identifies required modalities.
3. Builds physical volumes from slices.
4. Uses FLAIR as the reference grid.
5. Registers/resamples T1, T1ce, and T2 to the FLAIR grid.
6. Produces the standardized four-channel volume.

Invalid or incomplete cases should raise a clear preprocessing error.

## 6. Segmentation

Supported model names:

```text
unimatch
ipixmatch
```

Checkpoint mapping:

```text
unimatch  → models/segmentation/best_unimatch.pth
ipixmatch → models/segmentation/chunk3_best_ipixmatch.pth
```

The application layer should not load these checkpoints directly.

## 7. Segmentation Analysis

For WT, TC, and ET, the analysis layer provides:

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

Overall:

```text
mean_dice
```

Dice is calculated only when ground truth exists. Otherwise:

```json
{"dice": null, "mean_dice": null}
```

## 8. Reconstruction

Current DDPM characteristics:

```text
Input: FLAIR
Model resolution: 128 × 128
Output: reconstructed FLAIR volume
```

Reconstruction is performed slice-wise in batches.

Outputs:

```text
reconstructed_flair.nii.gz
previews/original.png
previews/reconstructed.png
```

Reference-dependent metrics:

```text
MSE
SSIM
PSNR
```

## 9. RAG and Reports

Flow:

```text
Structured analysis → knowledge retrieval → report context → Gemini/fallback
```

Current knowledge areas include MRI reconstruction, brain tumor segmentation, segmentation metrics, and project limitations.

RAG supplies contextual knowledge; it does not perform image analysis or calculate core measurements.

If Gemini is unavailable, a deterministic fallback report is generated.

## 10. Standard Analysis Interface

```python
from pipeline import run_pipeline

result = run_pipeline(
    input_path="path/to/mri_case",
    output_dir="path/to/output",
    model_name="unimatch",
)
```

Successful result:

```python
{
    "status": "success",
    "model": "...",
    "input_type": "...",
    "analysis": ".../analysis.json",
    "report": ".../report.md",
    "segmentation_zip": ".../segmentation_overlays.zip",
    "previews": {
        "WT": ".../WT.png",
        "TC": ".../TC.png",
        "ET": ".../ET.png",
        "metadata": ".../previews.json",
    },
}
```

## 11. Reconstruction Interface

Entry point:

```text
pipeline_reconstruction.py
```

Service:

```python
from services.reconstruction_service import run_reconstruction_case
```

Typical outputs:

```text
reconstructed_flair.nii.gz
reconstruction_analysis.json
previews/
```

## 12. Combined Workflow

Implemented in:

```text
services/combined_service.py
```

Processing order:

```text
Prepare case
→ reconstruct FLAIR
→ replace FLAIR with reconstruction
→ run segmentation
→ run reconstruction analysis
→ run segmentation analysis
→ generate combined report
```

Combined analysis:

```python
{
    "reconstruction": {...},
    "segmentation": {...}
}
```

The combined workflow does not prove that reconstruction improves segmentation without an explicit before/after experiment.

## 13. Output Contract

Standard analysis:

```text
output/case/
├── analysis.json
├── report.md
├── segmentation_overlays.zip
└── previews/
    ├── WT.png
    ├── TC.png
    ├── ET.png
    └── previews.json
```

Reconstruction additionally produces the reconstructed FLAIR volume, reconstruction analysis, and previews.

## 14. Application Boundary

### Application/backend owns

```text
File upload
API endpoints
Authentication/session management
Database
Job handling
Generated-file serving
Frontend integration
```

### AI pipeline owns

```text
MRI preparation
Reconstruction
Segmentation
Quantitative analysis
Visualization
RAG retrieval
Report generation
Output packaging
```

The frontend/backend should not directly load PyTorch checkpoints, calculate Dice, query FAISS, construct RAG prompts, or call Gemini.

## 15. Environment

```text
Python 3.11
```

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Required local variable:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Never commit `.env`, API keys, checkpoints, datasets, or generated outputs.

## 16. Error Handling

Handle at the application boundary:

```text
Missing input
Unsupported file type
ZIP without supported MRI data
Missing modality
Invalid model
Unreadable/corrupt data
DICOM geometry mismatch
Missing reconstruction reference
```

Missing ground truth is valid; Dice remains unavailable.

LLM failure should not invalidate deterministic analysis.

## 17. Minimum Integration Tests

```text
NIfTI → UniMatch
NIfTI → iPixMatch
DICOM → segmentation
DICOM ZIP → segmentation
NIfTI without ground truth
Standalone reconstruction
Combined reconstruction + segmentation
Missing input
Invalid model
Incomplete MRI case
Unsupported ZIP
```

## 18. Developer Rules

- Reuse existing services and inference implementations.
- Keep preprocessing, inference, analysis, RAG, and application code separate.
- Do not duplicate model-loading logic.
- Do not present model benchmarks as case-specific results.
- Do not fabricate unavailable metrics.
- Do not make clinical diagnostic claims.
- Do not commit secrets, checkpoints, datasets, or generated outputs.
- Update this document when the public integration contract changes.
