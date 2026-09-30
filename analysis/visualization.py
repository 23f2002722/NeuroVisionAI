from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image


def save_segmentation_overlay(
    image,
    predictions,
    output_dir,
    slice_index,
):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    image_slice = image[0, :, :, slice_index]

    image_slice = np.asarray(
        Image.fromarray(image_slice).resize(
            (240, 240),
            Image.Resampling.BILINEAR,
        ),
        dtype=np.float32,
    )

    image_min = image_slice.min()
    image_max = image_slice.max()

    if image_max > image_min:
        image_slice = (image_slice - image_min) / (
            image_max - image_min
        )
    else:
        image_slice = np.zeros_like(image_slice)

    rgb = np.stack(
        [image_slice, image_slice, image_slice],
        axis=-1,
    )

    masks = [
        predictions[0, slice_index] > 0,
        predictions[1, slice_index] > 0,
        predictions[2, slice_index] > 0,
    ]

    colors = [
        np.array([1.0, 0.0, 0.0]),
        np.array([0.0, 1.0, 0.0]),
        np.array([0.0, 0.0, 1.0]),
    ]

    alpha = 0.5

    for mask, color in zip(masks, colors):
        rgb[mask] = (
            rgb[mask] * (1.0 - alpha)
            + color * alpha
        )

    figure, axis = plt.subplots()
    axis.imshow(rgb)
    axis.axis("off")

    figure.savefig(
        output_dir / f"slice_{slice_index:03d}.png",
        bbox_inches="tight",
        pad_inches=0,
    )

    plt.close(figure)