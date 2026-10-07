import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.services.embedding import generate_embeddings, generate_embedding


def test_single_embedding():
    text = "Hello world, testing NeuraVault single embedding."
    vector = generate_embedding(text)
    assert isinstance(vector, list)
    assert len(vector) == 384
    print("Single embedding test passed, vector dimension:", len(vector))


def test_batch_embeddings():
    texts = [
        "First document text snippet.",
        "Second document text snippet."
    ]
    vectors = generate_embeddings(texts)
    assert len(vectors) == 2
    assert len(vectors[0]) == 384
    assert len(vectors[1]) == 384
    print("Batch embeddings test passed, count:", len(vectors))


def test_empty_input():
    res = generate_embeddings([])
    assert res == []
    print("Empty embeddings input test passed.")


if __name__ == "__main__":
    test_single_embedding()
    test_batch_embeddings()
    test_empty_input()
    print("All embedding tests passed successfully!")