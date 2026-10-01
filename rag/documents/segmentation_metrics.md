# Segmentation and Reconstruction Metrics

## Dice Similarity Coefficient

Dice measures the overlap between a predicted segmentation mask and a ground-truth mask.

For segmentation:

Dice = 2 × |Prediction ∩ Ground Truth| / (|Prediction| + |Ground Truth|)

Dice is calculated separately for:

- WT (Whole Tumor)
- TC (Tumor Core)
- ET (Enhancing Tumor)

A mean Dice value can be calculated across these regions.

Dice requires ground-truth segmentation masks. Therefore, it should not be generated for an uploaded case when no corresponding ground truth is available.

## MSE

Mean Squared Error measures the average squared difference between corresponding pixels of two images.

It requires a reference image for meaningful reconstruction evaluation.

## SSIM

Structural Similarity Index measures structural similarity between an image and a reference image.

It requires a suitable reference image.

## PSNR

Peak Signal-to-Noise Ratio measures reconstruction quality relative to a reference image and is expressed in decibels (dB).

It requires a reference image.

## Interpretation Rule

The analysis system should distinguish between:

1. Model outputs available for the current case.
2. Metrics that can be calculated for the current case.
3. Previously reported model-level experimental metrics.

A previously reported model-level metric must not be presented as if it were calculated from the current uploaded case.