"""Fake pipeline for PIPELINE_MODE=mock (frontend development, demos, CI).

Produces the same files, in the same layout, as the repo-root pipeline.run_pipeline
and returns the same dict, so the rest of the backend cannot tell the difference.
Needs no weights, no GPU, no vector index and no API key; stdlib only.
"""
from __future__ import annotations

import json
import struct
import time
import zipfile
import zlib
from pathlib import Path

SIZE = 240

# region -> (label, RGB colour, predicted pixels, slice, pixels on that slice)
REGIONS = {
    "WT": ("Whole Tumor", (220, 60, 60), 27238, 30, 1932),
    "TC": ("Tumor Core", (60, 200, 90), 9120, 33, 954),
    "ET": ("Enhancing Tumor", (70, 110, 230), 1704, 40, 122),
}

REPORT = """## AI-Assisted Medical Imaging Research Report (MOCK)

This is synthetic output from the mock pipeline. It is not a real analysis.

### Segmentation Findings

| Region | Predicted pixels | Max slice |
|--------|------------------|-----------|
| WT | 27238 | 30 |
| TC | 9120 | 33 |
| ET | 1704 | 40 |

### Limitations

Mock data only. Not a medical diagnosis.
"""


def _png(rgb: tuple[int, int, int]) -> bytes:
    """A SIZE x SIZE RGB PNG: dark-to-bright vertical gradient tinted with `rgb`."""
    rows = bytearray()
    for y in range(SIZE):
        shade = 40 + int(160 * y / (SIZE - 1))
        row = bytes(int(c * shade / 255) for c in rgb) * SIZE
        rows += b"\x00" + row

    def chunk(kind: bytes, data: bytes) -> bytes:
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    header = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(bytes(rows))) + chunk(b"IEND", b""))


def run_mock(input_path, output_dir, model_name, delay: float = 3.0, fail: bool = False) -> dict:
    time.sleep(delay)
    if fail:
        raise RuntimeError("Mock pipeline failure requested (MOCK_FAIL=true).")

    out = Path(output_dir)
    previews = out / "previews"
    previews.mkdir(parents=True, exist_ok=True)

    classes, meta = {}, {}
    for region, (label, rgb, pixels, slice_index, slice_pixels) in REGIONS.items():
        classes[region] = {
            "predicted_pixels": pixels,
            "ground_truth_pixels": None,
            "affected_slices": 48,
            "max_slice": slice_index,
            "max_slice_pixels": slice_pixels,
            "mean_probability": 0.003,
            "max_probability": 0.99,
            "dice": None,
        }
        (previews / f"{region}.png").write_bytes(_png(rgb))
        meta[region] = {"image": f"previews/{region}.png", "label": label,
                        "slice": slice_index, "pixels": slice_pixels}

    analysis = {"volume": "mock_case", "model": model_name, "slice_count": 155,
                "classes": classes, "mean_dice": None}
    (out / "analysis.json").write_text(json.dumps(analysis, indent=2), encoding="utf-8")
    (out / "report.md").write_text(REPORT, encoding="utf-8")
    (previews / "previews.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    overlays = out / "segmentation_overlays.zip"
    with zipfile.ZipFile(overlays, "w", zipfile.ZIP_DEFLATED) as archive:
        for region in REGIONS:
            archive.write(previews / f"{region}.png", f"preview_max_{region}.png")

    return {
        "status": "success",
        "model": model_name,
        "input_type": "nifti",
        "analysis": str(out / "analysis.json"),
        "report": str(out / "report.md"),
        "segmentation_zip": str(overlays),
        "previews": {**{r: str(previews / f"{r}.png") for r in REGIONS},
                     "metadata": str(previews / "previews.json")},
    }