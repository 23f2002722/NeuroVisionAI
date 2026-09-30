from pathlib import Path

import nibabel as nib
import numpy as np


def load_nifti(path):
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(path)

    image = nib.load(str(path))

    return {
        "path": str(path),
        "data": image.get_fdata(dtype=np.float32),
        "shape": image.shape,
        "voxel_spacing": image.header.get_zooms()[:3],
        "affine": image.affine,
    }