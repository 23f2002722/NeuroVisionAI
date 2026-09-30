import numpy as np

from preprocessing.mri import normalize_mri
from preprocessing.spatial import resize_slice

from preprocessing import slices
from preprocessing.spatial import resize_slice

from preprocessing.slices import get_all_slices
from preprocessing.volume import load_nifti_modalities
from models.segmentation.ipixmatch_inference import (
    load_model as load_ipixmatch_model,
    segment as segment_ipixmatch,
)
from models.segmentation.unimatch_inference import (
    load_model as load_unimatch_model,
    segment as segment_unimatch,
)


def run_nifti_segmentation(
    paths,
    model_name,
    checkpoint_path,
    threshold=0.3,
):
    volume = load_nifti_modalities(paths)
    slices = get_all_slices(volume["image"])

    if model_name == "unimatch":
        model = load_unimatch_model(checkpoint_path)
        segment_fn = segment_unimatch
    elif model_name == "ipixmatch":
        model = load_ipixmatch_model(checkpoint_path)
        segment_fn = segment_ipixmatch
    else:
        raise ValueError(f"Unsupported segmentation model: {model_name}")

    probabilities = []
    predictions = []

    for image in slices:
        image = normalize_mri(image)
        image = resize_slice(image)

        probability, prediction = segment_fn(
            model,
            image,
            threshold,
        )

        probabilities.append(probability)
        predictions.append(prediction)

    return {
        "volume": "nifti_case",
        "model": model_name,
        "slice_count": len(slices),
        "probabilities": np.stack(probabilities, axis=1),
        "predictions": np.stack(predictions, axis=1),
        "shape": volume["shape"],
        "voxel_spacing": volume["voxel_spacing"],
        "modalities": volume["modalities"],
    }

