import json
import numpy as np


CLASS_NAMES = ("WT", "TC", "ET")


def bounding_box(mask):
    ys, xs = np.where(mask)

    if len(xs) == 0:
        return None

    return {
        "x_min": int(xs.min()),
        "y_min": int(ys.min()),
        "x_max": int(xs.max()),
        "y_max": int(ys.max()),
        "width": int(xs.max() - xs.min() + 1),
        "height": int(ys.max() - ys.min() + 1),
    }


def centroid(mask):
    ys, xs = np.where(mask)

    if len(xs) == 0:
        return None

    return {
        "x": float(xs.mean()),
        "y": float(ys.mean()),
    }


def analyze_segmentation(prediction_path):
    result = np.load(prediction_path)

    probabilities = result["probabilities"]
    masks = result["masks"]

    analysis = {
        "image_shape": [
            int(masks.shape[1]),
            int(masks.shape[2]),
        ],
        "classes": {},
    }

    for i, name in enumerate(CLASS_NAMES):
        mask = masks[i]

        analysis["classes"][name] = {
            "positive_pixels": int(mask.sum()),
            "pixel_percentage": float(mask.mean() * 100),
            "mean_probability": float(probabilities[i].mean()),
            "max_probability": float(probabilities[i].max()),
            "bounding_box": bounding_box(mask),
            "centroid": centroid(mask),
        }

    return analysis


def save_analysis(analysis, output_path):
    with open(output_path, "w") as f:
        json.dump(analysis, f, indent=2)


if __name__ == "__main__":
    prediction_file = "tests/segmentation_result.npz"
    output_file = "tests/segmentation_analysis.json"

    result = analyze_segmentation(prediction_file)
    save_analysis(result, output_file)

    print(json.dumps(result, indent=2))
    print(f"\nSaved: {output_file}")