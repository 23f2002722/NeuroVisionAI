import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import nibabel as nib
import numpy as np

from analysis.brats import load_brats_masks, resize_mask
from preprocessing.spatial import resize_slice


CASE_DIR = Path(
    r"C:\Users\SHIVANG\Desktop\NeuroVisionAI\tests\BraTS-GLI-00005-100"
)

FLAIR_PATH = CASE_DIR / "BraTS-GLI-00005-100-t2f.nii"
SEG_PATH = CASE_DIR / "BraTS-GLI-00005-100-seg.nii"


def main():
    flair = nib.load(str(FLAIR_PATH)).get_fdata(dtype=np.float32)
    masks = load_brats_masks(SEG_PATH)

    tumor_slices = np.where(
        masks["WT"].reshape(masks["WT"].shape[0], -1).sum(axis=1) > 0
    )[0]

    # Pick the slice with the largest ground-truth tumor area.
    areas = masks["WT"].reshape(masks["WT"].shape[0], -1).sum(axis=1)
    slice_index = int(np.argmax(areas))

    image = flair[:, :, slice_index]
    mask = masks["WT"][:, :, slice_index]

    resized_image = resize_slice(
        image[np.newaxis, :, :],
        target_size=(240, 240),
    )[0]

    resized_mask = resize_mask(
        masks["WT"]
    )[slice_index]

    print("Tumor-containing slices:", len(tumor_slices))
    print("Selected slice:", slice_index)
    print("Original image shape:", image.shape)
    print("Original mask shape:", mask.shape)
    print("Resized image shape:", resized_image.shape)
    print("Resized mask shape:", resized_mask.shape)

    print("\nOriginal tumor bounding box:")

    ys, xs = np.where(mask)

    if len(xs):
        print(
            "x:",
            int(xs.min()),
            "to",
            int(xs.max()),
            "| y:",
            int(ys.min()),
            "to",
            int(ys.max()),
        )

    print("\nResized tumor bounding box:")

    ys, xs = np.where(resized_mask)

    if len(xs):
        print(
            "x:",
            int(xs.min()),
            "to",
            int(xs.max()),
            "| y:",
            int(ys.min()),
            "to",
            int(ys.max()),
        )

    print("\nTumor pixels:")
    print("Original:", int(mask.sum()))
    print("Resized:", int(resized_mask.sum()))


if __name__ == "__main__":
    main()