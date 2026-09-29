from analysis.runner import (
    run_reconstruction_analysis,
    run_segmentation_analysis,
)


def run_analysis_pipeline(
    segmentation_prediction_path,
    reconstruction_reference_path=None,
    reconstruction_output_path=None,
):
    reconstruction = run_reconstruction_analysis(
        reference_path=reconstruction_reference_path,
        reconstructed_path=reconstruction_output_path,
    )

    segmentation = run_segmentation_analysis(
        segmentation_prediction_path
    )

    return {
        "reconstruction": reconstruction,
        "segmentation": segmentation,
    }