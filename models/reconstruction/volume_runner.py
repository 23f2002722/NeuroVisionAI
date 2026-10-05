from pathlib import Path

import nibabel as nib
import numpy as np
import torch
from PIL import Image
from diffusers import DDPMScheduler, DDIMScheduler

from models.reconstruction.inference import load_model


BATCH_SIZE = 4


@torch.no_grad()
def reconstruct_batch(model, batch):
    noise_scheduler = DDPMScheduler(num_train_timesteps=1000)
    inference_scheduler = DDIMScheduler(num_train_timesteps=1000)

    inference_scheduler.set_timesteps(200)

    noise = torch.randn_like(batch)

    timesteps = torch.full(
        (batch.shape[0],),
        200,
        device=model.device,
        dtype=torch.long,
    )

    x = noise_scheduler.add_noise(
        batch,
        noise,
        timesteps,
    )

    timesteps_to_use = [
        t for t in inference_scheduler.timesteps
        if t <= 200
    ]

    for t in timesteps_to_use:
        t_batch = torch.full(
            (batch.shape[0],),
            t,
            device=model.device,
            dtype=torch.long,
        )

        model_input = torch.cat(
            [x, batch],
            dim=1,
        )

        noise_pred = model(
            model_input,
            t_batch,
        ).sample

        x = inference_scheduler.step(
            noise_pred,
            t,
            x,
        ).prev_sample

    reconstructed = x * 0.5 + 0.5

    return torch.clamp(
        reconstructed,
        0,
        1,
    ).squeeze(1).cpu().numpy()


def reconstruct_volume(
    flair_volume,
    output_dir,
    checkpoint_path,
    affine,
):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    model = load_model(checkpoint_path)

    height, width, slice_count = flair_volume.shape
    reconstructed_slices = []

    for start in range(0, slice_count, BATCH_SIZE):
        end = min(
            start + BATCH_SIZE,
            slice_count,
        )

        batch = []

        for slice_index in range(start, end):
            slice_data = flair_volume[:, :, slice_index]

            slice_min = slice_data.min()
            slice_max = slice_data.max()

            if slice_max > slice_min:
                normalized = (
                    (slice_data - slice_min)
                    / (slice_max - slice_min)
                )
            else:
                normalized = np.zeros_like(slice_data)

            image = Image.fromarray(
                (normalized * 255).astype(np.uint8)
            )

            resized = image.resize(
                (128, 128),
                Image.Resampling.BILINEAR,
            )

            batch.append(
                np.asarray(
                    resized,
                    dtype=np.float32,
                ) / 255.0
            )

        batch = torch.from_numpy(
            np.stack(batch)
        ).unsqueeze(1).to(model.device)

        reconstructed = reconstruct_batch(
            model,
            batch,
        )

        for reconstructed_slice in reconstructed:
            image = Image.fromarray(
                (reconstructed_slice * 255).astype(np.uint8)
            )

            image = image.resize(
                (width, height),
                Image.Resampling.BILINEAR,
            )

            reconstructed_slices.append(
                np.asarray(
                    image,
                    dtype=np.float32,
                ) / 255.0
            )

        print(
            f"Reconstructed slices {start + 1}-{end}/{slice_count}"
        )

    reconstructed_volume = np.stack(
        reconstructed_slices,
        axis=2,
    )

    output_path = (
        output_dir / "reconstructed_flair.nii.gz"
    )

    nib.save(
        nib.Nifti1Image(
            reconstructed_volume,
            affine,
        ),
        str(output_path),
    )

    return {
        "volume": reconstructed_volume,
        "output_path": str(output_path),
    }

def save_reconstruction_preview(
    flair_volume,
    reconstructed_volume,
    output_dir,
):
    output_dir = Path(output_dir)
    preview_dir = output_dir / "previews"
    preview_dir.mkdir(parents=True, exist_ok=True)

    slice_index = flair_volume.shape[2] // 2

    original = flair_volume[:, :, slice_index]
    reconstructed = reconstructed_volume[:, :, slice_index]

    def normalize(image):
        image_min = image.min()
        image_max = image.max()

        if image_max > image_min:
            return (image - image_min) / (image_max - image_min)

        return np.zeros_like(image)

    Image.fromarray(
        (normalize(original) * 255).astype(np.uint8)
    ).save(preview_dir / "original.png")

    Image.fromarray(
        (normalize(reconstructed) * 255).astype(np.uint8)
    ).save(preview_dir / "reconstructed.png")