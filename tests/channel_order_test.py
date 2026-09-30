import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from itertools import permutations
from pathlib import Path

import nibabel as nib
import numpy as np

from models.segmentation.unimatch_inference import load_model, segment
from preprocessing.mri import normalize_mri
from preprocessing.spatial import resize_slice
from analysis.brats import load_brats_masks, resize_mask


CASE_DIR = Path(r"C:\Users\SHIVANG\Desktop\NeuroVisionAI\tests\BraTS-GLI-00005-100")
CHECKPOINT = "models/segmentation/best_unimatch.pth"

MODALITIES = {
    "FLAIR": CASE_DIR / "BraTS-GLI-00005-100-t2f.nii",
    "T1": CASE_DIR / "BraTS-GLI-00005-100-t1n.nii",
    "T1ce": CASE_DIR / "BraTS-GLI-00005-100-t1c.nii",
    "T2": CASE_DIR / "BraTS-GLI-00005-100-t2w.nii",
}

ORDER = ("FLAIR", "T1", "T1ce", "T2")


def dice_score(prediction, target):
    prediction = prediction.astype(bool)
    target = target.astype(bool)

    denominator = prediction.sum() + target.sum()

    if denominator == 0:
        return 1.0

    intersection = np.logical_and(prediction, target).sum()
    return float(2 * intersection / denominator)


def main():
    volumes = {
        name: nib.load(str(path)).get_fdata(dtype=np.float32)
        for name, path in MODALITIES.items()
    }

    masks = load_brats_masks(
        CASE_DIR / "BraTS-GLI-00005-100-seg.nii"
    )

    target_masks = {
        name: resize_mask(mask)
        for name, mask in masks.items()
    }

    tumor_slices = np.where(
        masks["WT"].reshape(masks["WT"].shape[0], -1).sum(axis=1) > 0
    )[0]

    selected_slices = tumor_slices[::max(1, len(tumor_slices) // 6)][:6]

    model = load_model(CHECKPOINT)

    results = []

    for order in permutations(ORDER):
        prediction_masks = {
            "WT": [],
            "TC": [],
            "ET": [],
        }

        for index in selected_slices:
            image = np.stack(
                [volumes[name][:, :, index] for name in order],
                axis=0,
            )

            image = normalize_mri(image)
            image = resize_slice(image)

            _, prediction = segment(model, image, 0.3)

            prediction_masks["WT"].append(prediction[0])
            prediction_masks["TC"].append(prediction[1])
            prediction_masks["ET"].append(prediction[2])

        scores = {}

        for class_index, name in enumerate(("WT", "TC", "ET")):
            prediction = np.stack(prediction_masks[name])
            target = target_masks[name][selected_slices]

            scores[name] = dice_score(prediction, target)

        scores["mean"] = float(np.mean(list(scores.values())))

        results.append((order, scores))

        print(
            order,
            f"WT={scores['WT']:.4f}",
            f"TC={scores['TC']:.4f}",
            f"ET={scores['ET']:.4f}",
            f"Mean={scores['mean']:.4f}",
        )

    print("\nTop results:")
    for order, scores in sorted(
        results,
        key=lambda item: item[1]["mean"],
        reverse=True,
    )[:5]:
        print(
            order,
            f"Mean={scores['mean']:.4f}"
        )


if __name__ == "__main__":
    main()