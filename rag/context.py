def build_context(
    segmentation_analysis=None,
    retrieved_documents=None,
    reconstruction_analysis=None,
):
    sources = []
    knowledge = []

    for document in retrieved_documents or []:
        sources.append(document["source"])
        knowledge.append(document["text"])

    return {
        "reconstruction": reconstruction_analysis or {
            "available": False,
            "metrics": {},
        },
        "segmentation": segmentation_analysis or {},
        "knowledge": "\n\n".join(knowledge),
        "sources": sources,
    }