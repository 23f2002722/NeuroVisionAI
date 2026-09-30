import numpy as np
from skimage.transform import resize


TARGET_SIZE = (240, 240)


def resize_slice(image, target_size=TARGET_SIZE):
    image = np.asarray(image, dtype=np.float32)

    if image.ndim != 3:
        raise ValueError(f"Expected (C,H,W), got {image.shape}")

    channels = [
        resize(
            image[channel],
            target_size,
            order=1,
            preserve_range=True,
            anti_aliasing=True,
        ).astype(np.float32)
        for channel in range(image.shape[0])
    ]

    return np.stack(channels, axis=0)