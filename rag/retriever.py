from pathlib import Path
import json

import faiss
from sentence_transformers import SentenceTransformer


VECTORSTORE_DIR = Path("rag/vectorstore")
MODEL_NAME = "all-MiniLM-L6-v2"


class Retriever:
    def __init__(self):
        self.model = SentenceTransformer(MODEL_NAME)

        self.index = faiss.read_index(
            str(VECTORSTORE_DIR / "index.faiss")
        )

        with open(
            VECTORSTORE_DIR / "documents.json",
            encoding="utf-8",
        ) as f:
            self.documents = json.load(f)

    def search(self, query, top_k=2):
        embedding = self.model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).astype("float32")

        scores, indices = self.index.search(
            embedding,
            top_k,
        )

        results = []

        for score, index in zip(scores[0], indices[0]):
            if index == -1:
                continue

            results.append({
                "source": self.documents[index]["source"],
                "score": float(score),
                "text": self.documents[index]["text"],
            })

        return results


if __name__ == "__main__":
    retriever = Retriever()

    results = retriever.search(
        "What metrics are used to evaluate brain tumor segmentation?"
    )

    for result in results:
        print(f"\nSource: {result['source']}")
        print(f"Score: {result['score']:.4f}")
        print(result["text"][:300])