import sys
import io
from pathlib import Path
from starlette.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.main import app


def test_upload_text_file():
    client = TestClient(app)
    file_content = b"NeuraVault test file content for document upload and automated indexing."
    files = {
        "file": ("test_autoupload.txt", io.BytesIO(file_content), "text/plain")
    }

    response = client.post("/api/upload", files=files)
    assert response.status_code == 200, f"Upload failed: {response.text}"
    data = response.json()
    assert data["filename"] == "test_autoupload.txt"
    assert data["status"] == "success"
    assert data["chunks"] >= 1
    assert data["indexed"] >= 1
    print("Upload test passed successfully:", data)


if __name__ == "__main__":
    test_upload_text_file()
    print("All upload tests passed successfully!")
