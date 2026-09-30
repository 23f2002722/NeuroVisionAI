import numpy as np

from preprocessing.config import MODALITY_ORDER


def normalize_mri(image):
    image = np.asarray(image, dtype=np.float32)

    if image.ndim != 3:
        raise ValueError(
            f"Expected 3D MRI array, got shape {image.shape}"
        )

    if image.shape[0] == len(MODALITY_ORDER):
        channels_first = image
    elif image.shape[-1] == len(MODALITY_ORDER):
        channels_first = np.transpose(image, (2, 0, 1))
    else:
        raise ValueError(
            f"Expected {len(MODALITY_ORDER)} MRI channels, "
            f"got shape {image.shape}"
        )

    output = np.zeros_like(channels_first, dtype=np.float32)

    for channel in range(len(MODALITY_ORDER)):
        image_channel = channels_first[channel]
        mask = image_channel > 0

        if mask.sum() == 0:
            output[channel] = image_channel
            continue

        mean = image_channel[mask].mean()
        std = image_channel[mask].std() + 1e-8
        output[channel] = (image_channel - mean) / std

    return output