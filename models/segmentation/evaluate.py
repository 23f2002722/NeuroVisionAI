import h5py
import numpy as np


CLASS_NAMES = ("WT", "TC", "ET")


def load_ground_truth(image_path):
    with h5py.File(image_path, "r") as f:
        mask = f["mask"][:].astype(np.uint8)

    mask = np.transpose(mask, (2, 0, 1))

    return mask


def dice_score(pred, target):
    pred = pred.astype(bool)
    target = target.astype(bool)

    intersection = np.logical_and(pred, target).sum()
    denominator = pred.sum() + target.sum()

    if denominator == 0:
        return 1.0

    return (2.0 * intersection) / denominator


def evaluate(prediction_path, image_path):
    result = np.load(prediction_path)
    predicted_masks = result["masks"]

    ground_truth = load_ground_truth(image_path)

    if predicted_masks.shape != ground_truth.shape:
        raise ValueError(
            f"Shape mismatch: prediction={predicted_masks.shape}, "
            f"ground_truth={ground_truth.shape}"
        )

    scores = []

    for i, name in enumerate(CLASS_NAMES):
        score = dice_score(
            predicted_masks[i],
            ground_truth[i],
        )

        scores.append(score)

        print(
            f"{name}: "
            f"Dice={score:.4f} | "
            f"Predicted={predicted_masks[i].sum()} | "
            f"Ground Truth={ground_truth[i].sum()}"
        )

    mean_dice = np.mean(scores)

    print(f"Mean Dice: {mean_dice:.4f}")

    return scores, mean_dice


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print(
            "Usage: python evaluate.py "
            "<prediction.npz> <input.h5>"
        )
        raise SystemExit(1)

    prediction_file = sys.argv[1]
    input_file = sys.argv[2]

    evaluate(
        prediction_file,
        input_file,
    )