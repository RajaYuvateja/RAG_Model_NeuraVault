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
        json={"query": "salaries dataset and exploratory data analysis", "top_k": 3}
    )
    assert response.status_code == 200, f"Chat endpoint failed: {response.text}"
    data = response.json()
    assert "query" in data
    assert "answer" in data
    assert "sources" in data
    assert isinstance(data["sources"], list)
    print("Chat query test passed! Retrieved sources:", len(data["sources"]))
    print("Answer snippet:", data["answer"][:100])


def test_chat_empty_query():
    client = TestClient(app)
    response = client.post("/api/chat", json={"query": ""})
    assert response.status_code == 400
    print("Empty chat query correctly rejected with 400.")


if __name__ == "__main__":
    test_chat_query()
    test_chat_empty_query()
    print("All chat tests passed successfully!")
