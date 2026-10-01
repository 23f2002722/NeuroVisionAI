from models.segmentation.array_runner import run_array_segmentation
from preprocessing.dicom_volume import load_dicom_modalities


def run_dicom_segmentation(
    series,
    model_name,
    checkpoint_path,
    threshold=0.3,
):
    volume = load_dicom_modalities(series)

    result = run_array_segmentation(
        volume["image"],
        model_name,
        checkpoint_path,
        threshold,
    )

    return {
        "volume": "dicom_case",
        "model": model_name,
        "slice_count": result["slice_count"],
        "probabilities": result["probabilities"],
        "predictions": result["predictions"],
        "shape": volume["shape"],
        "voxel_spacing": volume["voxel_spacing"],
        "modalities": volume["modalities"],
        "image": volume["image"],
    }