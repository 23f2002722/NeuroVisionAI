import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import nibabel as nib
import numpy as np

from models.segmentation.unimatch_inference import load_model, segment
from preprocessing.mri import normalize_mri
from preprocessing.spatial import resize_slice
from analysis.brats import load_brats_masks, resize_mask


CASE_DIR = Path(
    r"C:\Users\SHIVANG\Desktop\NeuroVisionAI\tests\BraTS-GLI-00005-100"
)

CHECKPOINT = "models/segmentation/best_unimatch.pth"

PATHS = {
    "FLAIR": CASE_DIR / "BraTS-GLI-00005-100-t2f.nii",
    "T1": CASE_DIR / "BraTS-GLI-00005-100-t1n.nii",
    "T1ce": CASE_DIR / "BraTS-GLI-00005-100-t1c.nii",
    "T2": CASE_DIR / "BraTS-GLI-00005-100-t2w.nii",
}

SEG_PATH = CASE_DIR / "BraTS-GLI-00005-100-seg.nii"


def dice_score(prediction, target):
    prediction = prediction.astype(bool)
    target = target.astype(bool)

    denominator = prediction.sum() + target.sum()

    if denominator == 0:
        return 1.0

    intersection = np.logical_and(prediction, target).sum()

    return float(2 * intersection / denominator)


def get_slice(volume, axis, index):
    if axis == 0:
        return volume[index, :, :]
    if axis == 1:
        return volume[:, index, :]
    if axis == 2:
        return volume[:, :, index]

    raise ValueError("Invalid axis")


def get_mask_slice(mask, axis, index):
    if axis == 0:
        return mask[index, :, :]
    if axis == 1:
        return mask[:, index, :]
    if axis == 2:
        return mask[:, :, index]

    raise ValueError("Invalid axis")


def main():
    volumes = {
        name: nib.load(str(path)).get_fdata(dtype=np.float32)
        for name, path in PATHS.items()
    }

    masks = load_brats_masks(SEG_PATH)

    model = load_model(CHECKPOINT)

    for axis in range(3):
        shape = next(iter(volumes.values())).shape
        slice_count = shape[axis]

        predictions = {
            "WT": [],
            "TC": [],
            "ET": [],
        }

        targets = {
            "WT": [],
            "TC": [],
            "ET": [],
        }

        for index in range(slice_count):
            image = np.stack(
                [
                    get_slice(volumes[name], axis, index)
                    for name in ("FLAIR", "T1", "T1ce", "T2")
                ],
                axis=0,
            )

            image = normalize_mri(image)
            image = resize_slice(image)

            _, prediction = segment(
                model,
                image,
                0.3,
            )

            for class_index, name in enumerate(("WT", "TC", "ET")):
                target = get_mask_slice(
                    masks[name],
                    axis,
                    index,
                )

                target = resize_slice(
                    target[np.newaxis, :, :].astype(np.float32)
                )[0] > 0.5

                predictions[name].append(
                    prediction[class_index]
                )

                targets[name].append(target)

        scores = {}

        for name in ("WT", "TC", "ET"):
            prediction = np.stack(predictions[name])
            target = np.stack(targets[name])

            scores[name] = dice_score(
                prediction,
                target,
            )

        mean_dice = float(
            np.mean(
                [
                    scores["WT"],
                    scores["TC"],
                    scores["ET"],
                ]
            )
        )

        print(
            f"Axis {axis}: "
            f"WT={scores['WT']:.4f} "
            f"TC={scores['TC']:.4f} "
            f"ET={scores['ET']:.4f} "
            f"Mean={mean_dice:.4f}"
        )


if __name__ == "__main__":
    main()