from pathlib import Path

from models.reconstruction.volume_runner import (
    reconstruct_volume,
    save_reconstruction_preview,
)


CHECKPOINT_PATH = (
    "models/reconstruction/conditional_mri_checkpoint.pth"
)


def run_reconstruction_volume(
    flair_volume,
    output_dir,
    affine,
    checkpoint_path=CHECKPOINT_PATH,
):
    output_dir = Path(output_dir)

    result = reconstruct_volume(
        flair_volume=flair_volume,
        output_dir=output_dir,
        checkpoint_path=checkpoint_path,
        affine=affine,
    )

    save_reconstruction_preview(
        flair_volume=flair_volume,
        reconstructed_volume=result["volume"],
        output_dir=output_dir,
    )

    return {
        "model": "conditional_ddpm",
        "output": result["output_path"],
        "volume": result["volume"],
        "previews": {
            "original": str(
                output_dir / "previews" / "original.png"
            ),
            "reconstructed": str(
                output_dir / "previews" / "reconstructed.png"
            ),
        },
    }