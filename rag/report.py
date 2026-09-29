from analysis.pipeline import run_analysis_pipeline
from rag.context import build_context
from rag.llm import generate_report
from rag.retriever import Retriever


def generate_case_report(
    segmentation_prediction_path,
    reconstruction_reference_path=None,
    reconstruction_output_path=None,
):
    analysis = run_analysis_pipeline(
        segmentation_prediction_path=segmentation_prediction_path,
        reconstruction_reference_path=reconstruction_reference_path,
        reconstruction_output_path=reconstruction_output_path,
    )

    query = (
        "Explain MRI reconstruction, WT, TC, ET brain tumor "
        "segmentation, segmentation metrics, reconstruction metrics, "
        "and limitations."
    )

    documents = Retriever().search(
        query,
        top_k=3,
    )

    context = build_context(
        analysis=analysis,
        retrieved_documents=documents,
    )

    return generate_report(context)


if __name__ == "__main__":
    prediction_file = "tests/runner_unimatch_result.npz"

    report = generate_case_report(
        segmentation_prediction_path=prediction_file,
    )

    print("\n" + "=" * 60)
    print("NEUROVISIONAI AI-ASSISTED REPORT")
    print("=" * 60)
    print(report)