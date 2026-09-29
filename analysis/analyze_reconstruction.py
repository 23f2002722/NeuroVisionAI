import json
import numpy as np
from PIL import Image
from skimage.metrics import mean_squared_error, peak_signal_noise_ratio, structural_similarity


def load_image(path):
    image = Image.open(path).convert("L")
    return np.asarray(image, dtype=np.float32) / 255.0


def analyze_reconstruction(input_path, reconstructed_path, reference_path, output_path):
    input_image = load_image(input_path)
    reconstructed = load_image(reconstructed_path)
    reference = load_image(reference_path)

    if reconstructed.shape != reference.shape:
        raise ValueError(
            f"Shape mismatch: reconstructed={reconstructed.shape}, "
            f"reference={reference.shape}"
        )

    mse = mean_squared_error(reference, reconstructed)
    psnr = peak_signal_noise_ratio(
        reference,
        reconstructed,
        data_range=1.0,
    )
    ssim = structural_similarity(
        reference,
        reconstructed,
        data_range=1.0,
    )

    result = {
        "image_shape": [
            int(reconstructed.shape[0]),
            int(reconstructed.shape[1]),
        ],
        "metrics": {
            "mse": float(mse),
            "psnr": float(psnr),
            "ssim": float(ssim),
        },
    }

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    return result


if __name__ == "__main__":
    input_file = "input.png"
    reconstructed_file = "reconstructed.png"
    reference_file = "reference.png"
    output_file = "tests/reconstruction_analysis.json"

    result = analyze_reconstruction(
        input_file,
        reconstructed_file,
        reference_file,
        output_file,
    )

    print(json.dumps(result, indent=2))
    print(f"\nSaved: {output_file}")