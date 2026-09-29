from analysis.pipeline import run_analysis_pipeline
from rag.context import build_context
from rag.llm import generate_report
from rag.retriever import Retriever


def run_case_analysis(
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

    report = generate_report(context)

    return {
        "analysis": analysis,
        "sources": context["sources"],
        "report": report,
    }