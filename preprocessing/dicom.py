from collections import defaultdict
from pathlib import Path

import pydicom


def scan_dicom_series(case_dir):
    case_dir = Path(case_dir)
    series = defaultdict(list)

    for path in case_dir.rglob("*"):
        if not path.is_file():
            continue

        try:
            dataset = pydicom.dcmread(
                str(path),
                stop_before_pixels=True,
                force=True,
            )
        except Exception:
            continue

        series_uid = getattr(dataset, "SeriesInstanceUID", None)

        if series_uid is None:
            continue

        series[series_uid].append({
            "path": str(path),
            "series_description": getattr(dataset, "SeriesDescription", ""),
            "protocol_name": getattr(dataset, "ProtocolName", ""),
            "modality": getattr(dataset, "Modality", ""),
            "patient_id": getattr(dataset, "PatientID", ""),
            "series_number": getattr(dataset, "SeriesNumber", None),
            "instance_number": getattr(dataset, "InstanceNumber", None),
        })

    return dict(series)

def summarize_dicom_series(series):
    summary = []

    for series_uid, files in series.items():
        first = files[0]

        summary.append({
            "series_uid": series_uid,
            "file_count": len(files),
            "series_description": first["series_description"],
            "protocol_name": first["protocol_name"],
            "modality": first["modality"],
            "series_number": first["series_number"],
        })

    return summary

import numpy as np


def load_dicom_series(files):
    datasets = []

    for item in files:
        dataset = pydicom.dcmread(item["path"])
        datasets.append(dataset)

    if not datasets:
        raise ValueError("DICOM series contains no files")

    def slice_position(dataset):
        position = getattr(dataset, "ImagePositionPatient", None)

        if position is not None and len(position) >= 3:
            return float(position[2])

        return float(getattr(dataset, "InstanceNumber", 0))

    datasets.sort(key=slice_position)

    first = datasets[0]

    rows = int(first.Rows)
    columns = int(first.Columns)

    volume = np.stack(
        [dataset.pixel_array for dataset in datasets],
        axis=-1,
    )

    spacing = getattr(first, "PixelSpacing", [1.0, 1.0])
    slice_spacing = float(
        getattr(first, "SpacingBetweenSlices",
                getattr(first, "SliceThickness", 1.0))
    )

    voxel_spacing = (
        float(spacing[0]),
        float(spacing[1]),
        slice_spacing,
    )

    return {
        "volume": volume.astype(np.float32),
        "shape": volume.shape,
        "voxel_spacing": voxel_spacing,
        "slice_count": len(datasets),
    }