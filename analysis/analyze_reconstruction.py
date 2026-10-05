import json

import nibabel as nib
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity


def load_image(path):
    image = Image.open(path).convert("L")
    return np.asarray(image, dtype=np.float32) / 255.0


def load_volume(path):
    image = nib.load(str(path))
    volume = image.get_fdata(dtype=np.float32)

    volume_min = volume.min()
    volume_max = volume.max()

    if volume_max > volume_min:
        volume = (
            (volume - volume_min)
            / (volume_max - volume_min)
        )
    else:
        volume = np.zeros_like(volume)

    return volume


def calculate_metrics(reference_path, reconstructed_path):
    reference = load_volume(reference_path)
    reconstructed = load_volume(reconstructed_path)

    if reference.shape != reconstructed.shape:
        raise ValueError(
            f"Volume shape mismatch: "
            f"{reference.shape} vs {reconstructed.shape}"
        )

    mse = float(
        np.mean((reference - reconstructed) ** 2)
    )

    ssim_scores = []

    for slice_index in range(reference.shape[2]):
        reference_slice = reference[:, :, slice_index]
        reconstructed_slice = reconstructed[:, :, slice_index]

        ssim_scores.append(
            structural_similarity(
                reference_slice,
                reconstructed_slice,
                data_range=1.0,
            )
        )

    ssim = float(np.mean(ssim_scores))

    psnr = (
        float("inf")
        if mse == 0
        else float(10 * np.log10(1.0 / mse))
    )

    return {
        "mse": mse,
        "ssim": ssim,
        "psnr": psnr,
    }


def analyze_reconstruction(
    reference_path=None,
    reconstructed_path=None,
):
    result = {
        "available": False,
        "metrics": {},
    }

    if reference_path and reconstructed_path:
        result["metrics"] = calculate_metrics(
            reference_path,
            reconstructed_path,
        )
        result["available"] = True

    return result


def save_analysis(analysis, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2)


if __name__ == "__main__":
    reference_file = "tests/reference.nii.gz"
    reconstructed_file = (
        "tests/reconstructed.nii.gz"
    )
    output_file = "tests/reconstruction_analysis.json"

    result = analyze_reconstruction(
        reference_file,
        reconstructed_file,
    )

    print(json.dumps(result, indent=2))
    save_analysis(result, output_file)