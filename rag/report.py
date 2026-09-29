from analysis.runner import run_segmentation_analysis
from rag.context import build_context
from rag.llm import generate_report
from rag.retriever import Retriever


def generate_segmentation_report(prediction_path):
    analysis = run_segmentation_analysis(prediction_path)

    query = (
        "Explain WT, TC, ET segmentation results, "
        "segmentation metrics, and limitations."
    )

    documents = Retriever().search(query, top_k=3)

    context = build_context(
        analysis,
        documents,
    )

    return generate_report(context)


if __name__ == "__main__":
    prediction_file = "tests/runner_unimatch_result.npz"

    report = generate_segmentation_report(
        prediction_file
    )

    print("\n" + "=" * 60)
    print("NEUROVISIONAI AI-ASSISTED REPORT")
    print("=" * 60)
    print(report)