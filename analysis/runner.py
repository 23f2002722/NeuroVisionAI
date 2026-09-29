from analysis.analyze_reconstruction import (
    analyze_reconstruction,
    save_analysis as save_reconstruction_analysis,
)
from analysis.analyze_segmentation import (
    analyze_segmentation,
    save_analysis as save_segmentation_analysis,
)


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