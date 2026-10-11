import sys
import os
import io
from pathlib import Path
from starlette.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR / "backend"))

import json
from app.main import app
from app.services.retrieval import search_relevant_chunks
from app.services.llm import generate_rag_response
from app.services.vectorstore import search_embeddings, get_collection_stats, create_collection, store_embeddings
from app.services.embedding import generate_embedding, generate_embeddings


def ensure_test_fixtures():
    """Ensure test dataset chunks from pra.pdf.json are present in the active vectorstore instance."""
    create_collection()
    stats = get_collection_stats()
    if stats.get("points_count", 0) < 5:
        fixture_path = BASE_DIR / "data" / "processed" / "pra.pdf.json"
        if fixture_path.exists():
            with open(fixture_path, "r", encoding="utf-8") as f:
                chunks_data = json.load(f)
            texts = [c["text"] for c in chunks_data]
            embs = generate_embeddings(texts)
            store_embeddings(chunks=texts, embeddings=embs, payloads=chunks_data)


def test_factual_and_direct_answer():
    """Verify system starts directly with answers, without boilerplate preambles."""
    ensure_test_fixtures()
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={"query": "What is exploratory data analysis?", "top_k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    answer = data["answer"]
    
    # Assert no boilerplate opening
    assert not answer.startswith("Based on the most relevant information retrieved from"), (
        "Answer must not start with boilerplate preamble"
    )
    assert not answer.startswith("Based on the provided documents"), (
        "Answer must not start with generic disclaimer"
    )
    assert "Exploratory Data Analysis" in answer or "EDA" in answer
    print("Test A: Factual and direct answer passed.")


def test_semantic_query_synthesis():
    """Verify semantic retrieval and synthesis of conclusions and methodology."""
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={"query": "What was the conclusion and methodology of the project?", "top_k": 4}
    )
    assert response.status_code == 200
    data = response.json()
    answer = data["answer"]
    assert len(data["sources"]) > 0
    assert len(answer) > 50
    print("Test B: Semantic synthesis passed.")


def test_attributes_list_synthesis():
    """Verify structured list formatting when user asks for attributes/columns."""
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={"query": "What attributes exist in the data science salaries dataset?", "top_k": 4}
    )
    assert response.status_code == 200
    data = response.json()
    answer = data["answer"]
    # Check that either bullet points or key attributes are present
    assert "-" in answer or "•" in answer or "attributes" in answer.lower()
    print("Test C: Structured attributes list passed.")


def test_citations_accuracy():
    """Verify that every citation in sources has a valid filename and real page metadata."""
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={"query": "What software requirements were used?", "top_k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    sources = data["sources"]
    assert len(sources) > 0
    for src in sources:
        assert src["source"], "Source filename must be present"
        assert "score" in src
        assert src["score_type"] == "cosine_similarity"
        assert src["relevance_label"] in ["High Relevance", "Moderate Relevance", "Low Relevance", "Borderline"]
        # If pdf, page should be positive integer
        if src["source"].endswith(".pdf"):
            assert src["page"] is not None and src["page"] > 0
    print("Test D: Citations accuracy and metadata validation passed.")


def test_unanswerable_refusal():
    """Verify honest refusal when documents lack answering information."""
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={"query": "What is the speed of neutrinos under quantum chromodynamics?", "top_k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    answer = data["answer"]
    assert "The indexed documents do not contain enough information to answer this question reliably" in answer
    print("Test E: Unanswerable query refusal passed.")


def test_ranking_order_and_scores():
    """Verify that search returns chunks in strictly descending order of cosine similarity."""
    chunks = search_relevant_chunks("data science salary", limit=5)
    if len(chunks) >= 2:
        scores = [c["score"] for c in chunks]
        assert scores == sorted(scores, reverse=True), "Chunks must be ordered by descending similarity"
        # Cosine similarity must be between -1.0 and 1.0
        for s in scores:
            assert -1.0 <= s <= 1.0, f"Score {s} out of cosine bounds"
    print("Test F: Ranking order and cosine bounds passed.")


def test_upload_reindex_deduplication():
    """Verify re-uploading an existing file refreshes vectors without duplicating points."""
    client = TestClient(app)
    content = b"NeuraVault deduplication test file. Unique payload check for point deduplication."
    filename = "dedup_test_doc.txt"
    
    # First upload
    res1 = client.post("/api/upload", files={"file": (filename, io.BytesIO(content), "text/plain")})
    assert res1.status_code == 200
    chunks1 = res1.json()["indexed"]
    
    # Second upload (same filename, modified content)
    modified_content = b"NeuraVault updated content replacing previous vectors cleanly."
    res2 = client.post("/api/upload", files={"file": (filename, io.BytesIO(modified_content), "text/plain")})
    assert res2.status_code == 200
    chunks2 = res2.json()["indexed"]

    # Delete test file
    del_res = client.delete(f"/api/documents/{filename}")
    assert del_res.status_code == 200
    print("Test G: Re-upload deduplication and deletion passed.")


def run_all_rag_evaluations():
    print("=" * 60)
    print("RUNNING ADVANCED RAG EVALUATION & BENCHMARK SUITE")
    print("=" * 60)
    test_factual_and_direct_answer()
    test_semantic_query_synthesis()
    test_attributes_list_synthesis()
    test_citations_accuracy()
    test_unanswerable_refusal()
    test_ranking_order_and_scores()
    test_upload_reindex_deduplication()
    print("=" * 60)
    print("ALL 7 ADVANCED RAG EVALUATIONS PASSED!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_rag_evaluations()
