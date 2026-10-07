import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.services.chunking import create_chunks


def test_chunking_basic():
    sample_text = (
        "NeuraVault is an enterprise retrieval-augmented generation platform. "
        "It indexes company documents into high-dimensional vector spaces. "
        "Users can query their internal knowledge base with precise source citations."
    )
    chunks = create_chunks(sample_text, chunk_size=50, chunk_overlap=10)
    assert len(chunks) > 0
    print(f"Basic chunking: {len(chunks)} chunks produced.")


def test_chunking_empty():
    assert create_chunks("") == []
    assert create_chunks("   \n\t  ") == []
    print("Empty chunking test passed.")


def test_chunking_long_text():
    long_text = "Knowledge chunking test. " * 100
    chunks = create_chunks(long_text, chunk_size=200, chunk_overlap=40)
    assert len(chunks) > 1
    print(f"Long text chunking: {len(chunks)} chunks produced.")


if __name__ == "__main__":
    test_chunking_basic()
    test_chunking_empty()
    test_chunking_long_text()
    print("All chunking tests passed successfully!")
