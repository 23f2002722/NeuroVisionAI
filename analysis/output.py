from pathlib import Path
import shutil

import matplotlib.pyplot as plt
import numpy as np


def create_segmentation_zip(segmentation_dir, output_path):
    segmentation_dir = Path(segmentation_dir)
    output_path = Path(output_path)

    shutil.make_archive(
        str(output_path.with_suffix("")),
        "zip",
        root_dir=segmentation_dir,
    )

    return output_path.with_suffix(".zip")


def create_segmentation_previews(
    image,
    predictions,
    analysis,
    output_dir,
):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    class_names = {
        0: "WT",
        1: "TC",
        2: "ET",
    }

    for class_index, class_name in class_names.items():
        slice_index = analysis["classes"][class_name]["max_slice"]

        if slice_index is None:
            continue

        image_slice = image[0, :, :, slice_index]

        image_min = image_slice.min()
        image_max = image_slice.max()

        if image_max > image_min:
            image_slice = (
                image_slice - image_min
            ) / (image_max - image_min)
        else:
            image_slice = np.zeros_like(image_slice)

        image_slice = np.asarray(
            __import__("PIL").Image.fromarray(
                image_slice
            ).resize(
                (240, 240),
                __import__("PIL").Image.Resampling.BILINEAR,
            )
        )

        mask = predictions[
            class_index,
            slice_index,
            :,
            :,
        ]

        rgb = np.stack(
            [image_slice, image_slice, image_slice],
            axis=-1,
        )

        color = np.array(
            [1.0, 0.0, 0.0]
            if class_name == "WT"
            else [0.0, 1.0, 0.0]
            if class_name == "TC"
            else [0.0, 0.0, 1.0]
        )

        mask = mask > 0
        alpha = 0.5

        rgb[mask] = (
            rgb[mask] * (1.0 - alpha)
            + color * alpha
        )

        figure, axis = plt.subplots()
        axis.imshow(rgb)
        axis.set_title(
            f"{class_name} - slice {slice_index}"
        )
        axis.axis("off")

        figure.savefig(
            output_dir / f"preview_max_{class_name}.png",
            bbox_inches="tight",
            pad_inches=0,
        )

        plt.close(figure)