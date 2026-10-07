# NeuraVault — Enterprise Retrieval-Augmented Generation (RAG) Platform

NeuraVault is an enterprise RAG knowledge engine designed to ingest corporate documents (PDF, TXT, MD), convert them into dense vector embeddings, index them into a Qdrant vector database, and provide sub-second semantic retrieval with grounded answers and page-level source citations.

---

## 🌟 Key Features

- **Multi-Format Document Ingestion**: Supports `.pdf`, `.txt`, `.md` with automatic encoding detection and corrupt file recovery.
- **Recursive Semantic Chunking**: Configurable sliding chunk windows (1000 characters with 200 overlap) preserving natural sentence boundaries.
- **Dense Vector Embeddings**: Powered by Hugging Face's `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors).
- **Persistent Qdrant Vector Store**: Unified local Qdrant collection with deterministic UUIDs preventing document point collisions.
- **FastAPI Backend**: High-performance asynchronous REST endpoints with CORS support, lifecycle handlers, and comprehensive error handling.
- **Grounded Answer Synthesis**: Generates accurate answers with page-level citations and similarity scores, with OpenAI fallback or local extractive synthesis.
- **Modern Dark-Mode Frontend**: Built with React 18 and Vite, featuring Glassmorphism, live vector telemetry, and interactive chunk inspection.

---

## 🏗️ Architecture

```
User / Client
      │
      ▼
React 18 + Vite Frontend (Port 5173)
      │
      ▼ REST API
FastAPI Backend (Port 8000)
 ┌────┼───────────────────────────┐
 │    ▼                           ▼
 │  /api/upload                 /api/chat
 │    │                           │
 │    ▼ Ingestion                 ▼ Embedding
 │  pypdf & Text Extract        SentenceTransformer
 │    │                           │
 │    ▼ Chunking                  ▼ Semantic Search
 │  RecursiveSplitter           Qdrant Vector DB
 └────┴──────────────┬────────────┘
                     ▼
           Grounded Citations & Answers
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend Setup
From the root directory:
```bash
# Activate the virtual environment
.venv\Scripts\activate   # Windows

# Run tests
python tests/run_all.py

# Start FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

API documentation will be available at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
From the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and root greeting |
| `GET` | `/api/health` | Health status and vector store telemetry |
| `POST` | `/api/upload` | Upload and automatically index a document |
| `GET` | `/api/documents` | List uploaded documents and chunk statistics |
| `GET` | `/api/documents/{filename}/chunks` | View raw extracted chunks for a document |
| `DELETE` | `/api/documents/{filename}` | Delete document and remove its vector embeddings |
| `POST` | `/api/documents/reindex` | Re-index all processed documents into Qdrant |
| `POST` | `/api/chat` | Query knowledge base with grounded RAG answering |

---

## 🛠️ CLI Utilities

- **Batch Ingest Existing Uploads**:
  ```bash
  python scripts/ingest_documents.py
  ```
- **Reindex Processed Chunks**:
  ```bash
  python scripts/reindex_vectors.py
  ```
- **Execute Test Suite**:
  ```bash
  python tests/run_all.py
  ```
