# NeuroVisionAI
A Generative AI framework for medical image reconstruction, segmentation, and analysis.

## Backend

A FastAPI service that accepts an MRI case, runs it through `pipeline.run_pipeline`
(segmentation + analysis + RAG report) in a background worker, and serves the results.
Research use only; not a medical diagnosis.

### Run it without any ML setup (mock mode)

Gives the full API with fake results, so the frontend can be built against it.
Needs only the light dependencies:

```bash
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install fastapi uvicorn python-multipart sqlalchemy python-dotenv nibabel pydicom numpy SimpleITK scikit-image
PIPELINE_MODE=mock python -m backend                   # Windows (cmd): set PIPELINE_MODE=mock && python -m backend
```

### Run it for real

```bash
pip install -r requirements.txt
cp .env.example .env                 # then set GEMINI_API_KEY=...
```

1. Put the checkpoints in `models/segmentation/`: `best_unimatch.pth` and `chunk3_best_ipixmatch.pth`.
2. Build the knowledge index once: `python -m rag.index`
3. Start: `python -m backend`

`GET /api/health` tells you exactly what is missing if something is not ready.

Always run from the repository root, and as a single process (no `--workers`).

### Endpoints

Interactive docs and the machine-readable contract: <http://127.0.0.1:8000/docs> and `/openapi.json`.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/cases` | Upload a case: one `.zip` (NIfTI or DICOM) or `.nii`/`.nii.gz` files; optional form field `model` (`unimatch` / `ipixmatch`). Returns `202` + `case_id`. |
| GET | `/api/cases` | Recent cases. |
| GET | `/api/cases/{id}` | Status (`queued` / `running` / `completed` / `failed`), analysis, image links, warnings. Poll this. |
| GET | `/api/cases/{id}/report` | Research report (markdown). |
| GET | `/api/cases/{id}/images/{WT\|TC\|ET}` | Preview PNG. |
| GET | `/api/cases/{id}/download/overlays` | ZIP of all slice overlays. |
| DELETE | `/api/cases/{id}` | Delete a case (not while it is running). |
| GET | `/api/health` | Readiness checks. |

Errors are always `{"code": "...", "message": "..."}`.

```bash
curl -F "files=@input/BraTS-GLI-00005-100.zip" http://127.0.0.1:8000/api/cases
curl http://127.0.0.1:8000/api/cases/<case_id>
```

### Configuration

All optional, set in `.env` or the environment. See `.env.example` for the full list
(`PIPELINE_MODE`, `BACKEND_HOST`, `BACKEND_PORT`, `DATA_DIR`, `CORS_ORIGINS`,
`MAX_UPLOAD_MB`, `JOB_TIMEOUT_SECONDS`, `RETENTION_DAYS`, `LOG_LEVEL`, mock options, `GEMINI_API_KEY`).