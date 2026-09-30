from analysis.volume import analyze_volume
from models.segmentation.volume_runner import run_volume_segmentation

from analysis.analyze_reconstruction import (
    analyze_reconstruction,
    save_analysis as save_reconstruction_analysis,
)
from analysis.analyze_segmentation import (
    analyze_segmentation,
    save_analysis as save_segmentation_analysis,
)

from analysis.volume import analyze_volume
from models.segmentation.nifti_runner import run_nifti_segmentation


def run_nifti_analysis(
    paths,
    model_name,
    checkpoint_path,
    threshold=0.3,
):
    result = run_nifti_segmentation(
        paths=paths,
        model_name=model_name,
        checkpoint_path=checkpoint_path,
        threshold=threshold,
    )

    return analyze_volume(result)

def run_reconstruction_analysis(
    reference_path=None,
    reconstructed_path=None,
    output_path=None,
):
    analysis = analyze_reconstruction(
        reference_path,
        reconstructed_path,
    )

    if output_path:
        save_reconstruction_analysis(analysis, output_path)

    return analysis


def run_segmentation_analysis(prediction_path, output_path=None):
    analysis = analyze_segmentation(prediction_path)

    if output_path:
        save_segmentation_analysis(analysis, output_path)

    return analysis

def run_volume_analysis(
    volume_dir,
    model_name,
    checkpoint_path,
    volume_name="volume_1",
    threshold=0.3,
):
    result = run_volume_segmentation(
        volume_dir=volume_dir,
        model_name=model_name,
        checkpoint_path=checkpoint_path,
        volume_name=volume_name,
        threshold=threshold,
    )

    return analyze_volume(result)