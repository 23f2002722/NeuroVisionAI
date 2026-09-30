import numpy as np


def get_slice(volume, index):
    volume = np.asarray(volume, dtype=np.float32)

    if volume.ndim != 4:
        raise ValueError(f"Expected volume with shape (C,H,W,D), got {volume.shape}")

    if index < 0 or index >= volume.shape[3]:
        raise IndexError(f"Slice index {index} out of range")

    return volume[:, :, :, index]


def get_all_slices(volume):
    volume = np.asarray(volume, dtype=np.float32)

    if volume.ndim != 4:
        raise ValueError(f"Expected volume with shape (C,H,W,D), got {volume.shape}")

    return [volume[:, :, :, index] for index in range(volume.shape[3])]