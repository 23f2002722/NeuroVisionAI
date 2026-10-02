import numpy as np
from preprocessing.nifti import load_nifti


def load_nifti_modalities(modalities):
    volumes = []
    shape = None
    voxel_spacing = None

    for modality in ("FLAIR", "T1", "T1ce", "T2"):
        result = load_nifti(modalities[modality])
        volume = result["data"]

        if shape is None:
            shape = volume.shape
            voxel_spacing = result["voxel_spacing"]
        elif volume.shape != shape:
            raise ValueError(
                f"Volume shape mismatch for {modality}: "
                f"expected {shape}, got {volume.shape}"
            )

        volumes.append(volume)

    image = np.stack(volumes, axis=0)

    return {
        "image": image,
        "shape": shape,
        "voxel_spacing": voxel_spacing,
        "affine": load_nifti(modalities["FLAIR"])["affine"],
        "modalities": modalities,
    }