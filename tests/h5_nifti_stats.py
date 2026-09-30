import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import h5py
import nibabel as nib
import numpy as np

from preprocessing.mri import normalize_mri


H5_PATH = Path(
    r"C:\Users\SHIVANG\Desktop\NeuroVisionAI\tests\volume_331_slice_41.h5"
)

CASE_DIR = Path(
    r"C:\Users\SHIVANG\Desktop\NeuroVisionAI\tests\BraTS-GLI-00005-100"
)


PATHS = {
    "FLAIR": CASE_DIR / "BraTS-GLI-00005-100-t2f.nii",
    "T1": CASE_DIR / "BraTS-GLI-00005-100-t1n.nii",
    "T1ce": CASE_DIR / "BraTS-GLI-00005-100-t1c.nii",
    "T2": CASE_DIR / "BraTS-GLI-00005-100-t2w.nii",
}


def stats(name, image):
    image = np.asarray(image)

    print(f"\n{name}")
    print("shape:", image.shape)

    for index in range(image.shape[0]):
        channel = image[index]

        positive = channel > 0

        if positive.any():
            values = channel[positive]
            print(
                f"channel {index}: "
                f"min={values.min():.4f} "
                f"max={values.max():.4f} "
                f"mean={values.mean():.4f} "
                f"std={values.std():.4f} "
                f"nonzero={int(positive.sum())}"
            )
        else:
            print(f"channel {index}: empty")


def main():
    with h5py.File(H5_PATH, "r") as f:
        h5_image = f["image"][:].astype(np.float32)

    h5_image = np.transpose(h5_image, (2, 0, 1))

    stats("H5 raw", h5_image)

    h5_normalized = normalize_mri(h5_image)

    stats("H5 normalized", h5_normalized)

    volumes = {
        name: nib.load(str(path)).get_fdata(dtype=np.float32)
        for name, path in PATHS.items()
    }

    print("\nNIfTI volume statistics")

    for name, volume in volumes.items():
        positive = volume > 0
        values = volume[positive]

        print(
            f"{name}: "
            f"shape={volume.shape} "
            f"min={values.min():.4f} "
            f"max={values.max():.4f} "
            f"mean={values.mean():.4f} "
            f"std={values.std():.4f} "
            f"nonzero={int(positive.sum())}"
        )

    print("\nSelected NIfTI slices after normalization")

    # Use a few representative axial slices.
    for index in (50, 80, 100, 120, 140):
        image = np.stack(
            [
                volumes["FLAIR"][:, :, index],
                volumes["T1"][:, :, index],
                volumes["T1ce"][:, :, index],
                volumes["T2"][:, :, index],
            ],
            axis=0,
        )

        normalized = normalize_mri(image)

        print(f"\nSlice {index}")
        for channel, name in enumerate(
            ("FLAIR", "T1", "T1ce", "T2")
        ):
            values = normalized[channel]
            print(
                f"{name}: "
                f"min={values.min():.4f} "
                f"max={values.max():.4f} "
                f"mean={values.mean():.4f} "
                f"std={values.std():.4f}"
            )


if __name__ == "__main__":
    main()