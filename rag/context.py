def build_context(analysis, retrieved_documents=None):
    sources = []
    knowledge = []

    for document in retrieved_documents or []:
        sources.append(document["source"])
        knowledge.append(document["text"])

    return {
        "analysis": analysis,
        "knowledge": "\n\n".join(knowledge),
        "sources": sources,
    }