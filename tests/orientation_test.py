import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import nibabel as nib
import numpy as np


CASE_DIR = Path(
    r"C:\Users\SHIVANG\Desktop\NeuroVisionAI\tests\BraTS-GLI-00005-100"
)

PATHS = {
    "FLAIR": CASE_DIR / "BraTS-GLI-00005-100-t2f.nii",
    "T1": CASE_DIR / "BraTS-GLI-00005-100-t1n.nii",
    "T1ce": CASE_DIR / "BraTS-GLI-00005-100-t1c.nii",
    "T2": CASE_DIR / "BraTS-GLI-00005-100-t2w.nii",
}


def main():
    volumes = {
        name: nib.load(str(path)).get_fdata(dtype=np.float32)
        for name, path in PATHS.items()
    }

    shape = next(iter(volumes.values())).shape

    print("Volume shape:", shape)
    print()

    for axis in range(3):
        slice_shape = tuple(
            shape[index]
            for index in range(3)
            if index != axis
        )

        print(
            f"Axis {axis}:",
            f"{shape[axis]} slices",
            f"slice shape={slice_shape}",
        )

    print("\nTumor distribution by axis:")

    seg = nib.load(
        str(
            CASE_DIR
            / "BraTS-GLI-00005-100-seg.nii"
        )
    ).get_fdata()

    tumor = np.logical_or(seg == 2, seg == 4)

    for axis in range(3):
        axes = tuple(
            index
            for index in range(3)
            if index != axis
        )

        areas = tumor.sum(axis=axes)

        print(
            f"Axis {axis}:",
            f"max tumor pixels={int(areas.max())}",
            f"tumor-containing slices={int((areas > 0).sum())}",
        )


if __name__ == "__main__":
    main()