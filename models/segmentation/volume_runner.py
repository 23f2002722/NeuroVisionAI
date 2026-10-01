from pathlib import Path

import h5py
import numpy as np

from models.segmentation.ipixmatch_inference import (
    load_model as load_ipixmatch_model,
    segment as segment_ipixmatch,
)
from models.segmentation.unimatch_inference import (
    load_model as load_unimatch_model,
    segment as segment_unimatch,
)


def get_slice_files(volume_dir, volume_name="volume_1"):
    volume_dir = Path(volume_dir)

    files = list(
        volume_dir.glob(f"{volume_name}_slice_*.h5")
    )

    return sorted(
        files,
        key=lambda path: int(
            path.stem.split("_")[-1]
        ),
    )


def load_h5_slice(path):
    with h5py.File(path, "r") as f:
        image = f["image"][:].astype(np.float32)
        mask = f["mask"][:].astype(np.uint8)

    return (
        np.transpose(image, (2, 0, 1)),
        np.transpose(mask, (2, 0, 1)),
    )


def normalize_image(image):
    output = np.zeros_like(image, dtype=np.float32)

    for channel in range(image.shape[0]):
        image_channel = image[channel]
        positive = image_channel > 0

        if positive.sum() == 0:
            output[channel] = image_channel
            continue

        mean = image_channel[positive].mean()
        std = image_channel[positive].std() + 1e-8
        output[channel] = (image_channel - mean) / std

    return output


def run_volume_segmentation(
    volume_dir,
    model_name,
    checkpoint_path,
    volume_name="volume_1",
    threshold=0.3,
):
    slice_files = get_slice_files(
        volume_dir,
        volume_name,
    )

    if not slice_files:
        raise ValueError(
            f"No slices found for {volume_name}"
        )

    if model_name == "unimatch":
        model = load_unimatch_model(checkpoint_path)
        segment_fn = segment_unimatch
    elif model_name == "ipixmatch":
        model = load_ipixmatch_model(checkpoint_path)
        segment_fn = segment_ipixmatch
    else:
        raise ValueError(
            f"Unsupported segmentation model: {model_name}"
        )

    probabilities = []
    predictions = []
    ground_truth = []

    for slice_path in slice_files:
        image, mask = load_h5_slice(slice_path)
        image = normalize_image(image)

        probability, prediction = segment_fn(
            model,
            image,
            threshold,
        )

        probabilities.append(probability)
        predictions.append(prediction)
        ground_truth.append(mask)

    return {
        "volume": volume_name,
        "model": model_name,
        "slice_count": len(slice_files),
        "probabilities": np.stack(probabilities, axis=1),
        "predictions": np.stack(predictions, axis=1),
        "ground_truth": np.stack(ground_truth, axis=1),
    }