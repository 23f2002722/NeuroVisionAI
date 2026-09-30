from analysis.case import CasePaths
from models.reconstruction.service import run_reconstruction_service
from rag.service import run_case_analysis


def run_neurovision_pipeline(
    case: CasePaths,
    model_name="unimatch",
    reconstruction_output_path=None,
):
    reconstruction = None

    if case.reconstruction_input:
        reconstruction = run_reconstruction_service(
            input_path=case.reconstruction_input,
            output_path=reconstruction_output_path,
        )

    analysis = None

    if case.segmentation_input:
        analysis = run_case_analysis(
            segmentation_input_path=case.segmentation_input,
            model_name=model_name,
            reconstruction_reference_path=case.reconstruction_reference,
            reconstruction_output_path=(
                reconstruction["output"]
                if reconstruction
                else None
            ),
        )

    return {
        "reconstruction": reconstruction,
        "analysis": analysis,
    }