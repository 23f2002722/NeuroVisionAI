import numpy as np

from preprocessing.dicom import load_dicom_series
from preprocessing.dicom_modalities import (
    identify_dicom_modalities,
    validate_dicom_modalities,
)


def load_dicom_modalities(series):
    modalities = identify_dicom_modalities(series)
    validation = validate_dicom_modalities(modalities)

    if not validation["valid"]:
        raise ValueError(
            "Missing required MRI modalities: "
            + ", ".join(validation["missing"])
        )

    volumes = []
    shape = None
    voxel_spacing = None

    for modality in ("FLAIR", "T1", "T1ce", "T2"):
        result = load_dicom_series(series[modalities[modality]])
        volume = result["volume"]

        if shape is None:
            shape = volume.shape
            voxel_spacing = result["voxel_spacing"]
        elif volume.shape != shape:
            raise ValueError(
                f"DICOM modalities have incompatible spatial dimensions. "
                f"{modality} has shape {volume.shape}, while the reference modality "
                f"has shape {shape}. Registration/resampling is required before segmentation."
            )

        volumes.append(volume)

    image = np.stack(volumes, axis=0)

    return {
        "image": image,
        "shape": shape,
        "voxel_spacing": voxel_spacing,
        "modalities": modalities,
    }