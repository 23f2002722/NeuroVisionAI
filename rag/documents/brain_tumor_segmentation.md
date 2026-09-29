# Brain Tumor Segmentation

## Dataset

The segmentation models were developed using the BraTS2020 dataset.

Each patient includes four MRI modalities:

- T1
- T1ce
- T2
- FLAIR

Expert-annotated masks are provided for three tumor regions:

- WT: Whole Tumor
- TC: Tumor Core
- ET: Enhancing Tumor

## Models

The project implements two semi-supervised segmentation frameworks:

- UniMatch
- iPixMatch

UniMatch uses a teacher-student learning framework combining supervised segmentation and consistency learning.

iPixMatch extends the UniMatch approach with pixel-level affinity learning.

## Inference

The segmentation stage produces probability maps and binary masks for WT, TC, and ET.

The current inference implementation uses a probability threshold to generate binary masks.

## Project Results

The reported best model-level results are:

UniMatch:
- WT Dice: 0.8294
- TC Dice: 0.7614
- ET Dice: 0.8640
- Mean Dice: 0.8183

iPixMatch:
- WT Dice: 0.8234
- TC Dice: 0.7670
- ET Dice: 0.8709
- Mean Dice: 0.8204

These results come from the project's reported evaluation experiments and should not be presented as the Dice score of an individual uploaded case unless ground-truth annotations are available and the score is actually calculated.

## Output Analysis

For an individual inference result, the analysis layer can report model-derived quantities such as:

- positive pixel count
- percentage of the image represented by the mask
- mean predicted probability
- maximum predicted probability
- bounding box
- centroid

These measurements describe the model output and are not a medical diagnosis.