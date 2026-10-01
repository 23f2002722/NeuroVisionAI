import numpy as np
import torch
from PIL import Image
from torchvision import transforms
from diffusers import UNet2DModel, DDPMScheduler, DDIMScheduler


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL_CONFIG = {
    "sample_size": 128,
    "in_channels": 2,
    "out_channels": 1,
    "layers_per_block": 2,
    "block_out_channels": (64, 128, 256, 256),
    "down_block_types": (
        "DownBlock2D",
        "DownBlock2D",
        "AttnDownBlock2D",
        "DownBlock2D",
    ),
    "up_block_types": (
        "UpBlock2D",
        "AttnUpBlock2D",
        "UpBlock2D",
        "UpBlock2D",
    ),
}


def load_model(checkpoint_path):
    model = UNet2DModel(**MODEL_CONFIG).to(DEVICE)

    checkpoint = torch.load(
        checkpoint_path,
        map_location=DEVICE
    )

    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    return model


def load_image(image_path):
    transform = transforms.Compose([
        transforms.Grayscale(),
        transforms.Resize((128, 128)),
        transforms.ToTensor(),
        transforms.Normalize([0.5], [0.5]),
    ])

    image = Image.open(image_path)
    return transform(image).unsqueeze(0).to(DEVICE)


@torch.no_grad()
def reconstruct(model, corrupted_input):
    noise_scheduler = DDPMScheduler(
        num_train_timesteps=1000
    )

    inference_scheduler = DDIMScheduler(
        num_train_timesteps=1000
    )

    inference_scheduler.set_timesteps(200)

    noise = torch.randn_like(corrupted_input)

    x = noise_scheduler.add_noise(
        corrupted_input,
        noise,
        torch.tensor([200], device=DEVICE)
    )

    timesteps_to_use = [
        t for t in inference_scheduler.timesteps
        if t <= 200
    ]

    for t in timesteps_to_use:
        t_batch = torch.tensor(
            [t],
            device=DEVICE,
            dtype=torch.long
        )

        model_input = torch.cat(
            [x, corrupted_input],
            dim=1
        )

        noise_pred = model(
            model_input,
            t_batch
        ).sample

        x = inference_scheduler.step(
            noise_pred,
            t,
            x
        ).prev_sample

    reconstructed = (
        x.squeeze().cpu().numpy() * 0.5
    ) + 0.5

    return np.clip(reconstructed, 0, 1)


def reconstruct_mri(
    input_path,
    output_path,
    checkpoint_path
):
    model = load_model(checkpoint_path)

    corrupted_input = load_image(input_path)

    reconstructed = reconstruct(
        model,
        corrupted_input
    )

    output = Image.fromarray(
        (reconstructed * 255).astype(np.uint8)
    )

    output.save(output_path)

    return reconstructed


if __name__ == "__main__":
    checkpoint = "models/reconstruction/conditional_mri_checkpoint.pth"
    input_image = "input.png"
    output_image = "reconstructed.png"

    reconstruct_mri(
        input_image,
        output_image,
        checkpoint
    )

    print(f"Reconstruction complete: {output_image}")