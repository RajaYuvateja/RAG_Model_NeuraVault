import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.services.embedding import generate_embeddings
from app.services.vectorstore import (
    create_collection,
    store_embeddings,
    search_embeddings,
    get_collection_stats
)


def test_vectorstore_lifecycle():
    chunks = [
        "Artificial Intelligence is changing software development.",
        "NeuraVault is a state-of-the-art RAG architecture."
    ]

    vectors = generate_embeddings(chunks)
    assert len(vectors) == 2

    # Verify collection
    create_collection()

    # Store embeddings
    count = store_embeddings(
        chunks=chunks,
        embeddings=vectors,
        payloads=[
            {"source": "test_doc.txt", "chunk_id": "0", "text": chunks[0]},
            {"source": "test_doc.txt", "chunk_id": "1", "text": chunks[1]}
        ]
    )
    assert count == 2
    print("Stored points:", count)

    # Search embeddings
    query_vector = vectors[0]
    results = search_embeddings(query_vector=query_vector, limit=2)
    assert len(results) > 0
    assert results[0]["score"] > 0.8
    print("Top match score:", results[0]["score"], "text:", results[0]["text"][:40])

    # Stats
    stats = get_collection_stats()
    assert stats["points_count"] >= 2
    print("Collection points count:", stats["points_count"])


if __name__ == "__main__":
    test_vectorstore_lifecycle()
    print("All vectorstore tests passed successfully!")