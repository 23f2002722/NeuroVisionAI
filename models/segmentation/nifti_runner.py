from models.segmentation.array_runner import run_array_segmentation
from preprocessing.volume import load_nifti_modalities


def run_nifti_segmentation(paths, model_name, checkpoint_path, threshold=0.3):
    volume = load_nifti_modalities(paths)

    result = run_array_segmentation(
        volume["image"],
        model_name,
        checkpoint_path,
        threshold,
    )

    return {
        "volume": "nifti_case",
        "model": model_name,
        "slice_count": result["slice_count"],
        "probabilities": result["probabilities"],
        "predictions": result["predictions"],
        "shape": volume["shape"],
        "voxel_spacing": volume["voxel_spacing"],
        "modalities": volume["modalities"],
        "image": volume["image"],
    }