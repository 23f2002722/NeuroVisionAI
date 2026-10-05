import h5py
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

IN_CHANNELS = 4
NUM_CLASSES = 3
BASE_CHANNELS = 32
DROPOUT = 0.10

CLASS_NAMES = ("WT", "TC", "ET")


class DoubleConv(nn.Module):
    def __init__(self, ic, oc, drop=0.0):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(ic, oc, 3, padding=1, bias=False),
            nn.BatchNorm2d(oc),
            nn.ReLU(True),
            nn.Dropout2d(drop),
            nn.Conv2d(oc, oc, 3, padding=1, bias=False),
            nn.BatchNorm2d(oc),
            nn.ReLU(True),
        )

    def forward(self, x):
        return self.net(x)


class Down(nn.Module):
    def __init__(self, ic, oc, drop=0.0):
        super().__init__()
        self.net = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(ic, oc, drop),
        )

    def forward(self, x):
        return self.net(x)


class Up(nn.Module):
    def __init__(self, ic, oc):
        super().__init__()
        self.up = nn.ConvTranspose2d(
            ic,
            ic // 2,
            2,
            stride=2,
        )
        self.conv = DoubleConv(ic, oc)

    def forward(self, x, skip):
        x = self.up(x)

        dh = skip.size(2) - x.size(2)
        dw = skip.size(3) - x.size(3)

        x = F.pad(
            x,
            [
                dw // 2,
                dw - dw // 2,
                dh // 2,
                dh - dh // 2,
            ],
        )

        return self.conv(torch.cat([skip, x], 1))


class UNet2D(nn.Module):
    def __init__(self, ic=4, nc=3, b=32, drop=0.1):
        super().__init__()

        self.inc = DoubleConv(ic, b)
        self.d1 = Down(b, b * 2)
        self.d2 = Down(b * 2, b * 4)
        self.d3 = Down(b * 4, b * 8)
        self.d4 = Down(b * 8, b * 16, drop)

        self.u1 = Up(b * 16, b * 8)
        self.u2 = Up(b * 8, b * 4)
        self.u3 = Up(b * 4, b * 2)
        self.u4 = Up(b * 2, b)

        self.outc = nn.Conv2d(b, nc, 1)

    def forward(self, x):
        x1 = self.inc(x)
        x2 = self.d1(x1)
        x3 = self.d2(x2)
        x4 = self.d3(x3)
        x5 = self.d4(x4)

        d = self.u1(x5, x4)
        d = self.u2(d, x3)
        d = self.u3(d, x2)
        feat = self.u4(d, x1)

        return self.outc(feat), feat


def load_model(checkpoint_path, device=None):
    if device is None:
        device = DEVICE
    try:
        if torch.cuda.is_available() and getattr(device, "type", "") == "cuda":
            torch.cuda.empty_cache()
        model = UNet2D(
            IN_CHANNELS,
            NUM_CLASSES,
            BASE_CHANNELS,
            DROPOUT,
        ).to(device)

        checkpoint = torch.load(
            checkpoint_path,
            map_location=device,
            weights_only=False,
        )

        model.load_state_dict(checkpoint["teacher_state"])
        model.eval()
        return model
    except Exception as e:
        print(f"CUDA load notice ({e}), falling back to CPU...")
        cpu_dev = torch.device("cpu")
        model = UNet2D(
            IN_CHANNELS,
            NUM_CLASSES,
            BASE_CHANNELS,
            DROPOUT,
        ).to(cpu_dev)

        checkpoint = torch.load(
            checkpoint_path,
            map_location=cpu_dev,
            weights_only=False,
        )

        model.load_state_dict(checkpoint["teacher_state"])
        model.eval()
        return model


def load_h5(image_path):
    with h5py.File(image_path, "r") as f:
        image = f["image"][:].astype(np.float32)

    return np.transpose(image, (2, 0, 1))


def normalize_image(image):
    output = np.zeros_like(image, dtype=np.float32)

    for c in range(image.shape[0]):
        channel = image[c]
        mask = channel > 0

        if mask.sum() == 0:
            output[c] = channel
            continue

        mean = channel[mask].mean()
        std = channel[mask].std() + 1e-8

        output[c] = (channel - mean) / std

    return output


@torch.no_grad()
def segment(model, image, threshold=0.3):
    dev = next(model.parameters()).device
    tensor = torch.from_numpy(image).unsqueeze(0).to(dev)

    probabilities = torch.sigmoid(model(tensor)[0])
    probabilities = probabilities[0].cpu().numpy()

    masks = (probabilities > threshold).astype(np.uint8)

    return probabilities, masks

def segment_image(
    image,
    checkpoint_path,
    output_path=None,
    threshold=0.3,
):
    model = load_model(checkpoint_path)

    image = np.asarray(image, dtype=np.float32)

    if image.ndim != 3:
        raise ValueError(
            f"Expected 3D image array, got shape {image.shape}"
        )

    if image.shape[0] != IN_CHANNELS:
        raise ValueError(
            f"Expected {IN_CHANNELS} channels, "
            f"got {image.shape[0]}"
        )

    probabilities, masks = segment(
        model,
        image,
        threshold,
    )

    if output_path:
        np.savez_compressed(
            output_path,
            probabilities=probabilities,
            masks=masks,
        )

    return probabilities, masks

def segment_h5(
    image_path,
    checkpoint_path,
    output_path=None,
    threshold=0.3,
):
    model = load_model(checkpoint_path)

    image = load_h5(image_path)
    image = normalize_image(image)

    if image.shape[0] != IN_CHANNELS:
        raise ValueError(
            f"Expected {IN_CHANNELS} channels, "
            f"got {image.shape[0]}"
        )

    probabilities, masks = segment(
        model,
        image,
        threshold,
    )

    if output_path:
        np.savez_compressed(
            output_path,
            probabilities=probabilities,
            masks=masks,
        )

    return probabilities, masks


if __name__ == "__main__":
    checkpoint = (
        "models/segmentation/"
        "chunk3_best_ipixmatch.pth"
    )

    input_file = "tests/volume_331_slice_41.h5"

    output_file = (
        "tests/ipixmatch_segmentation_result.npz"
    )

    print(f"Device: {DEVICE}")

    probabilities, masks = segment_h5(
        input_file,
        checkpoint,
        output_file,
    )

    for i, name in enumerate(CLASS_NAMES):
        print(
            f"{name} probability: "
            f"min={probabilities[i].min():.4f}, "
            f"max={probabilities[i].max():.4f}, "
            f"mean={probabilities[i].mean():.4f}"
        )

    print(f"Input shape: {masks.shape}")
    print(f"Output shape: {masks.shape}")
    print(f"Saved: {output_file}")

    for name, mask in zip(CLASS_NAMES, masks):
        print(f"{name}: {mask.sum()} positive pixels")