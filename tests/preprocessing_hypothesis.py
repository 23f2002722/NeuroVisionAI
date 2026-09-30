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


def whole_image_normalize(image):
    image = np.asarray(image, dtype=np.float32)
    output = np.zeros_like(image)

    for channel in range(image.shape[0]):
        ch = image[channel]
        mean = ch.mean()
        std = ch.std() + 1e-8
        output[channel] = (ch - mean) / std

    return output


def print_stats(name, image):
    print(f"\n{name}")

    for index, modality in enumerate(
        ("FLAIR", "T1", "T1ce", "T2")
    ):
        ch = image[index]

        print(
            f"{modality}: "
            f"min={ch.min():.4f} "
            f"max={ch.max():.4f} "
            f"mean={ch.mean():.4f} "
            f"std={ch.std():.4f} "
            f"zero_fraction={(ch == 0).mean():.4f}"
        )


def main():
    with h5py.File(H5_PATH, "r") as f:
        h5 = f["image"][:].astype(np.float32)

    h5 = np.transpose(h5, (2, 0, 1))

    print_stats("ACTUAL H5", h5)

    volumes = {
        name: nib.load(str(path)).get_fdata(dtype=np.float32)
        for name, path in PATHS.items()
    }

    slice_index = 100

    image = np.stack(
        [
            volumes["FLAIR"][:, :, slice_index],
            volumes["T1"][:, :, slice_index],
            volumes["T1ce"][:, :, slice_index],
            volumes["T2"][:, :, slice_index],
        ],
        axis=0,
    )

    current = normalize_mri(image)

    print_stats(
        "CURRENT: nonzero normalization",
        current,
    )

    hypothesis = whole_image_normalize(image)

    print_stats(
        "HYPOTHESIS: whole-image normalization",
        hypothesis,
    )

    hypothesis_then_training = normalize_mri(
        hypothesis
    )

    print_stats(
        "HYPOTHESIS + TRAINING NORMALIZATION",
        hypothesis_then_training,
    )


if __name__ == "__main__":
    main()