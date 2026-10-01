from pathlib import Path
import json

import faiss
from sentence_transformers import SentenceTransformer


DOCUMENT_DIR = Path("rag/documents")
VECTORSTORE_DIR = Path("rag/vectorstore")
MODEL_NAME = "all-MiniLM-L6-v2"


def load_documents():
    documents = []

    for path in sorted(DOCUMENT_DIR.glob("*.md")):
        documents.append({
            "source": path.name,
            "text": path.read_text(encoding="utf-8"),
        })

    return documents


def build_index():
    documents = load_documents()

    if not documents:
        raise ValueError("No RAG documents found.")

    model = SentenceTransformer(MODEL_NAME)

    texts = [doc["text"] for doc in documents]
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings.astype("float32"))

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    faiss.write_index(
        index,
        str(VECTORSTORE_DIR / "index.faiss"),
    )

    with open(VECTORSTORE_DIR / "documents.json", "w", encoding="utf-8") as f:
        json.dump(documents, f, indent=2)

    print(f"Indexed {len(documents)} documents.")
    print(f"Vector dimension: {embeddings.shape[1]}")


if __name__ == "__main__":
    build_index()