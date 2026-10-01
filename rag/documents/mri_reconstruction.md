# MRI Reconstruction

## Purpose

The reconstruction stage uses a conditional Denoising Diffusion Probabilistic Model (DDPM) to reconstruct MRI images affected by degradation such as motion-related artifacts.

The existing model was trained using paired clean and motion-corrupted MRI images. The reconstruction workflow applies normalization, diffusion-based inference, and denoising to generate a reconstructed MRI representation.

## Model

The existing reconstruction model is a conditional diffusion model with a U-Net backbone.

The capstone reuses the trained checkpoint rather than retraining the model.

## Evaluation

When a suitable clean reference image is available, reconstruction quality can be evaluated using:

- MSE (Mean Squared Error)
- SSIM (Structural Similarity Index)
- PSNR (Peak Signal-to-Noise Ratio)

MSE measures pixel-level reconstruction error. Lower values indicate lower squared error.

SSIM measures structural similarity between images. Higher values indicate greater structural similarity.

PSNR measures the signal-to-noise relationship between the reconstructed image and reference image. Higher values generally indicate lower reconstruction error.

## Project Results

The reported final conditional reconstruction model achieved:

- MSE: 0.0011
- SSIM: 0.5732
- PSNR: 29.6911 dB

These are reported model-level experimental results and should not be interpreted as metrics for an arbitrary uploaded image.

## Capstone Role

The important research question is whether reconstruction improves the downstream tumor-segmentation task, rather than evaluating reconstruction only by visual quality.

The capstone therefore supports comparison between segmentation performed on degraded MRI input and segmentation performed after DDPM reconstruction.