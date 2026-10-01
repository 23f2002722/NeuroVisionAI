import numpy as np

CLASS_NAMES = ("WT", "TC", "ET")


def dice_score(prediction, ground_truth):
    prediction = prediction.astype(bool)
    ground_truth = ground_truth.astype(bool)

    intersection = np.logical_and(prediction, ground_truth).sum()
    denominator = prediction.sum() + ground_truth.sum()

    if denominator == 0:
        return 1.0

    return float(2.0 * intersection / denominator)


def analyze_volume(result):
    probabilities = result["probabilities"]
    predictions = result["predictions"]
    ground_truth = result.get("ground_truth")

    analysis = {
        "volume": result["volume"],
        "model": result["model"],
        "slice_count": result["slice_count"],
        "classes": {},
    }

    dice_scores = []

    for index, name in enumerate(CLASS_NAMES):
        probability = probabilities[index]
        prediction = predictions[index]

        positive_pixels = int(prediction.sum())
        affected_slices = np.where(
            prediction.reshape(prediction.shape[0], -1).sum(axis=1) > 0
        )[0]

        per_slice_pixels = prediction.reshape(
            prediction.shape[0], -1
        ).sum(axis=1)

        max_slice_index = int(np.argmax(per_slice_pixels))

        dice = None
        ground_truth_pixels = None

        if ground_truth is not None:
            target = ground_truth[index]
            ground_truth_pixels = int(target.sum())
            dice = dice_score(prediction, target)
            dice_scores.append(dice)

        analysis["classes"][name] = {
            "predicted_pixels": positive_pixels,
            "ground_truth_pixels": ground_truth_pixels,
            "affected_slices": int(len(affected_slices)),
            "max_slice": max_slice_index,
            "max_slice_pixels": int(per_slice_pixels[max_slice_index]),
            "mean_probability": float(probability.mean()),
            "max_probability": float(probability.max()),
            "dice": dice,
        }

    analysis["mean_dice"] = (
        float(np.mean(dice_scores))
        if dice_scores
        else None
    )

    return analysis