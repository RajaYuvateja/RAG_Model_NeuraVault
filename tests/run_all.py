import sys
from pathlib import Path

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))

from tests.backend.test_chunking import (
    test_chunking_basic,
    test_chunking_empty,
    test_chunking_long_text
)
from tests.backend.test_embedding import (
    test_single_embedding,
    test_batch_embeddings,
    test_empty_input
)
from tests.backend.test_vectorstore import test_vectorstore_lifecycle
from tests.backend.test_upload import test_upload_text_file
from tests.backend.test_chat import test_chat_query, test_chat_empty_query, test_chat_unanswerable_refusal
from tests.backend.test_rag_pipeline import run_all_rag_evaluations


def run_all():
    print("=" * 60)
    print("RUNNING NEURAVAULT BACKEND TEST SUITE & RAG EVALUATION")
    print("=" * 60)

    print("\n--- 1. Testing Chunking ---")
    test_chunking_basic()
    test_chunking_empty()
    test_chunking_long_text()
    print("Chunking tests passed.")

    print("\n--- 2. Testing Embedding Service ---")
    test_single_embedding()
    test_batch_embeddings()
    test_empty_input()
    print("Embedding tests passed.")

    print("\n--- 3. Testing Vector Store ---")
    test_vectorstore_lifecycle()
    print("Vector store tests passed.")

    print("\n--- 4. Testing Upload & Auto-indexing API ---")
    test_upload_text_file()
    print("Upload tests passed.")

    print("\n--- 5. Testing Chat & RAG Retrieval API ---")
    test_chat_query()
    test_chat_empty_query()
    test_chat_unanswerable_refusal()
    print("Chat & RAG tests passed.")

    print("\n--- 6. Advanced RAG Quality & Pipeline Evaluations ---")
    run_all_rag_evaluations()

    print("\n" + "=" * 60)
    print("ALL TESTS & EVALUATIONS PASSED SUCCESSFULLY! (6/6 suites)")
    print("=" * 60)


if __name__ == "__main__":
    run_all()
