from pathlib import Path

import numpy as np
from PIL import Image

from preprocessing.config import MODALITY_ORDER
from preprocessing.mri import normalize_mri


def load_modality(path):
    image = Image.open(path).convert("L")
    return np.asarray(image, dtype=np.float32)


def load_case(modality_paths):
    images = []

    for modality in MODALITY_ORDER:
        if modality not in modality_paths:
            raise ValueError(
                f"Missing modality: {modality}"
            )

        path = Path(modality_paths[modality])

        if not path.exists():
            raise FileNotFoundError(path)

        images.append(load_modality(path))

    shapes = {image.shape for image in images}

    if len(shapes) != 1:
        raise ValueError(
            f"All modalities must have the same shape, got {shapes}"
        )

    image = np.stack(images, axis=0)

    return normalize_mri(image)