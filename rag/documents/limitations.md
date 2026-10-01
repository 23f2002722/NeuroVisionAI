# System Limitations

## Research Prototype

NeuroVisionAI is an academic and research-oriented prototype. It is not an autonomous diagnostic system.

## Model Output

Segmentation results represent AI-generated model predictions. They should not be presented as definitive diagnoses.

## Ground Truth

Quantitative segmentation metrics such as Dice require corresponding ground-truth masks.

Reconstruction metrics such as MSE, SSIM and PSNR require an appropriate reference image.

When these references are unavailable, the system should report model-derived observations instead of fabricating evaluation metrics.

## Generalization

Model performance reported during experiments does not guarantee the same performance on every uploaded image.

Differences in acquisition conditions, preprocessing, image quality, modality and data distribution may affect model predictions.

## AI-Generated Explanation

The RAG and LLM layer should explain structured model outputs using retrieved knowledge. It should not independently calculate segmentation statistics, invent measurements, or provide a medical diagnosis.

## Intended Presentation

The application should use terminology such as:

"AI-generated segmentation"

or

"model-predicted region"

rather than presenting the output as a definitive diagnosis.

Final interpretation requires appropriate qualified clinical expertise.