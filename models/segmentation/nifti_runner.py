import nibabel as nib
import numpy as np

from models.segmentation.array_runner import run_array_segmentation
from preprocessing.volume import load_nifti_modalities


def load_ground_truth(path):
    data = np.asarray(
        nib.load(path).get_fdata()
    )

    if data.ndim != 3:
        raise ValueError(
            f"Expected 3D ground-truth volume, got {data.shape}"
        )

    return data


def prepare_ground_truth(mask):
    classes = np.zeros(
        (3, mask.shape[2], 240, 240),
        dtype=np.uint8,
    )

    for slice_index in range(mask.shape[2]):
        slice_mask = mask[:, :, slice_index]

        for class_index, label_values in enumerate(
            ((1, 2, 4), (1, 4), (4,))
        ):
            binary = np.isin(
                slice_mask,
                label_values,
            ).astype(np.uint8)

            binary = np.asarray(
                __import__("PIL").Image.fromarray(
                    binary
                ).resize(
                    (240, 240),
                    __import__("PIL").Image.Resampling.NEAREST,
                )
            )

            classes[
                class_index,
                slice_index,
            ] = binary

    return classes


def run_nifti_segmentation(
    paths,
    model_name,
    checkpoint_path,
    threshold=0.3,
    ground_truth_path=None,
):
    volume = load_nifti_modalities(paths)

    result = run_array_segmentation(
        volume["image"],
        model_name,
        checkpoint_path,
        threshold,
    )

    output = {
        "volume": "nifti_case",
        "model": model_name,
        "slice_count": result["slice_count"],
        "probabilities": result["probabilities"],
        "predictions": result["predictions"],
        "shape": volume["shape"],
        "voxel_spacing": volume["voxel_spacing"],
        "modalities": volume["modalities"],
        "image": volume["image"],
    }

    if ground_truth_path:
        ground_truth = load_ground_truth(
            ground_truth_path
        )

        output["ground_truth"] = prepare_ground_truth(
            ground_truth
        )

    return output