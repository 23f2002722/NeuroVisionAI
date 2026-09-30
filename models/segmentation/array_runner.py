import numpy as np

from preprocessing.mri import normalize_mri
from preprocessing.spatial import resize_slice
from preprocessing.slices import get_all_slices

from models.segmentation.ipixmatch_inference import (
    load_model as load_ipixmatch_model,
    segment as segment_ipixmatch,
)
from models.segmentation.unimatch_inference import (
    load_model as load_unimatch_model,
    segment as segment_unimatch,
)


def run_array_segmentation(
    image,
    model_name,
    checkpoint_path,
    threshold=0.3,
):
    slices = get_all_slices(image)

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

    for image_slice in slices:
        image_slice = normalize_mri(image_slice)
        image_slice = resize_slice(image_slice)

        probability, prediction = segment_fn(
            model,
            image_slice,
            threshold,
        )

        probabilities.append(probability)
        predictions.append(prediction)

    return {
        "probabilities": np.stack(probabilities, axis=1),
        "predictions": np.stack(predictions, axis=1),
        "slice_count": len(slices),
    }