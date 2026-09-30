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


def print_stats(name, image):
    print(f"\n{name}")

    for index in range(image.shape[0]):
        channel = image[index]

        print(
            f"channel {index}: "
            f"min={channel.min():.4f} "
            f"max={channel.max():.4f} "
            f"mean={channel.mean():.4f} "
            f"std={channel.std():.4f} "
            f"zero_fraction={(channel == 0).mean():.4f}"
        )


def main():
    with h5py.File(H5_PATH, "r") as f:
        h5 = f["image"][:].astype(np.float32)

    h5 = np.transpose(h5, (2, 0, 1))

    print_stats("H5 raw", h5)
    print_stats("H5 normalized", normalize_mri(h5))

    volumes = {
        name: nib.load(str(path)).get_fdata(dtype=np.float32)
        for name, path in PATHS.items()
    }

    for slice_index in (80, 100, 120):
        image = np.stack(
            [
                volumes["FLAIR"][:, :, slice_index],
                volumes["T1"][:, :, slice_index],
                volumes["T1ce"][:, :, slice_index],
                volumes["T2"][:, :, slice_index],
            ],
            axis=0,
        )

        print_stats(
            f"NIfTI slice {slice_index} raw",
            image,
        )

        print_stats(
            f"NIfTI slice {slice_index} normalized",
            normalize_mri(image),
        )


if __name__ == "__main__":
    main()
    