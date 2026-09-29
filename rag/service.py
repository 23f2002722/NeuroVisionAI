from pathlib import Path
import tempfile

from models.segmentation.runner import run_segmentation
from analysis.pipeline import run_analysis_pipeline
from rag.context import build_context
from rag.llm import generate_report
from rag.retriever import Retriever


SEGMENTATION_CHECKPOINTS = {
    "unimatch": "models/segmentation/best_unimatch.pth",
    "ipixmatch": "models/segmentation/chunk3_best_ipixmatch.pth",
}


def run_case_analysis(
    segmentation_input_path,
    model_name="unimatch",
    reconstruction_reference_path=None,
    reconstruction_output_path=None,
    segmentation_output_path=None,
):
    if model_name not in SEGMENTATION_CHECKPOINTS:
        raise ValueError(
            f"Unsupported segmentation model: {model_name}"
        )

    checkpoint_path = SEGMENTATION_CHECKPOINTS[model_name]

    if segmentation_output_path is None:
        output_dir = Path(tempfile.gettempdir()) / "neurovisionai"
        output_dir.mkdir(parents=True, exist_ok=True)
        segmentation_output_path = str(
            output_dir / f"{model_name}_segmentation.npz"
        )

    run_segmentation(
        model_name=model_name,
        input_path=segmentation_input_path,
        checkpoint_path=checkpoint_path,
        output_path=segmentation_output_path,
    )

    analysis = run_analysis_pipeline(
        segmentation_prediction_path=segmentation_output_path,
        reconstruction_reference_path=reconstruction_reference_path,
        reconstruction_output_path=reconstruction_output_path,
    )

    query = (
        "Explain MRI reconstruction, WT, TC, ET brain tumor "
        "segmentation, segmentation metrics, reconstruction metrics, "
        "and limitations."
    )

    documents = Retriever().search(query, top_k=3)

    context = build_context(
        analysis=analysis,
        retrieved_documents=documents,
    )

    report = generate_report(context)

    return {
        "model": model_name,
        "analysis": analysis,
        "sources": context["sources"],
        "report": report,
    }