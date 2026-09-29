from models.segmentation.unimatch_inference import segment_h5 as unimatch_segment
from models.segmentation.ipixmatch_inference import segment_h5 as ipixmatch_segment


def run_segmentation(
    model_name,
    input_path,
    checkpoint_path,
    output_path=None,
    threshold=0.3,
):
    if model_name == "unimatch":
        probabilities, masks = unimatch_segment(
            input_path,
            checkpoint_path,
            output_path,
            threshold,
        )
    elif model_name == "ipixmatch":
        probabilities, masks = ipixmatch_segment(
            input_path,
            checkpoint_path,
            output_path,
            threshold,
        )
    else:
        raise ValueError(f"Unsupported segmentation model: {model_name}")

    return {
        "model": model_name,
        "input": input_path,
        "output": output_path,
        "shape": list(probabilities.shape[1:]),
        "classes": {
            "WT": {
                "positive_pixels": int(masks[0].sum()),
                "mean_probability": float(probabilities[0].mean()),
                "max_probability": float(probabilities[0].max()),
            },
            "TC": {
                "positive_pixels": int(masks[1].sum()),
                "mean_probability": float(probabilities[1].mean()),
                "max_probability": float(probabilities[1].max()),
            },
            "ET": {
                "positive_pixels": int(masks[2].sum()),
                "mean_probability": float(probabilities[2].mean()),
                "max_probability": float(probabilities[2].max()),
            },
        },
    }