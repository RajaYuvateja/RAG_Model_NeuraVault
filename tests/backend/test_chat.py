import sys
from pathlib import Path
from starlette.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.main import app


def test_chat_query():
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={"query": "What is exploratory data analysis?", "top_k": 3}
    )
    assert response.status_code == 200, f"Chat endpoint failed: {response.text}"
    data = response.json()
    assert "query" in data
    assert "answer" in data
    assert "sources" in data
    assert isinstance(data["sources"], list)
    
    # Assert answer quality standards
    answer = data["answer"]
    assert not answer.startswith("Based on the most relevant information retrieved from"), (
        "Answer should start directly without boilerplate preamble!"
    )
    
    # Verify sources metadata and score semantics
    if data["sources"]:
        first_source = data["sources"][0]
        assert "score" in first_source
        assert first_source["score_type"] == "cosine_similarity"
        assert "relevance_label" in first_source
        assert "source" in first_source

    print("Chat query test passed! Retrieved sources:", len(data["sources"]))
    print("Answer snippet:", answer[:120])


def test_chat_empty_query():
    client = TestClient(app)
    response = client.post("/api/chat", json={"query": ""})
    assert response.status_code == 400
    print("Empty chat query correctly rejected with 400.")


def test_chat_unanswerable_refusal():
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={"query": "What is quantum gravity in French 18th century poetry?", "top_k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    answer = data["answer"]
    assert "The indexed documents do not contain enough information to answer this question reliably" in answer, (
        "System must refuse honestly when evidence is insufficient!"
    )
    print("Unanswerable query test passed! Refusal verified.")


if __name__ == "__main__":
    test_chat_query()
    test_chat_empty_query()
    test_chat_unanswerable_refusal()
    print("All chat tests passed successfully!")
