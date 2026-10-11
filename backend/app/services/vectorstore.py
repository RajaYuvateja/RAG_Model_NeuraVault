import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)
from app.config.settings import settings

COLLECTION_NAME = settings.COLLECTION_NAME

# Singleton client pointing to unified vectorstore path
_client_instance = None


def get_client() -> QdrantClient:
    global _client_instance
    if _client_instance is None:
        try:
            _client_instance = QdrantClient(path=str(settings.VECTORSTORE_PATH))
        except (RuntimeError, Exception) as e:
            print(f"[VectorStore] Storage path locked or inaccessible ({e}). Falling back to in-memory Qdrant instance.")
            _client_instance = QdrantClient(":memory:")
    return _client_instance


# Keep module-level client proxy for backward compatibility
class _ClientProxy:
    def __getattr__(self, name):
        return getattr(get_client(), name)


client = _ClientProxy()


def create_collection() -> bool:
    """Ensure the target collection exists with appropriate vector configuration."""
    q_client = get_client()
    collections = q_client.get_collections().collections
    existing = [c.name for c in collections]

    if COLLECTION_NAME not in existing:
        q_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=settings.EMBEDDING_DIMENSION,
                distance=Distance.COSINE
            )
        )
        return True
    return False


def store_embeddings(
    chunks: List[str],
    embeddings: List[List[float]],
    payloads: Optional[List[Dict[str, Any]]] = None,
    ids: Optional[List[str]] = None
) -> int:
    """
    Store chunks and embeddings in Qdrant with globally unique IDs
    to prevent unintentional overwrites.
    """
    if not chunks or not embeddings:
        return 0

    create_collection()
    q_client = get_client()
    points = []

    for idx, (chunk, vector) in enumerate(zip(chunks, embeddings)):
        if payloads and idx < len(payloads):
            payload = dict(payloads[idx])
            if "text" not in payload:
                payload["text"] = chunk
        else:
            payload = {"text": chunk}

        if ids and idx < len(ids):
            point_id = str(ids[idx])
        else:
            # Deterministic UUID based on source and chunk if available, or random UUID
            src = payload.get("source", "doc")
            cid = payload.get("chunk_id", str(idx))
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{src}_{cid}_{idx}"))

        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload=payload
            )
        )

    q_client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )

    return len(points)


def search_embeddings(
    query_vector: List[float],
    limit: int = 5,
    score_threshold: Optional[float] = None
) -> List[Dict[str, Any]]:
    """Search for most similar vectors in the collection."""
    create_collection()
    q_client = get_client()

    query_res = q_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=limit,
        score_threshold=score_threshold
    )

    results = []
    for pt in query_res.points:
        payload = pt.payload or {}
        results.append({
            "id": str(pt.id),
            "score": float(pt.score) if pt.score is not None else 0.0,
            "text": payload.get("text", ""),
            "source": payload.get("source", "unknown"),
            "page": payload.get("page", 1),
            "chunk_id": payload.get("chunk_id", ""),
            "payload": payload
        })
    return results


def delete_document_points(source_filename: str) -> bool:
    """Delete all indexed chunks for a given source filename."""
    try:
        q_client = get_client()
        create_collection()
        q_client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="source",
                        match=MatchValue(value=source_filename)
                    )
                ]
            )
        )
        return True
    except Exception as e:
        print(f"Error deleting points for {source_filename}: {e}")
        return False


def get_collection_stats() -> Dict[str, Any]:
    """Get metadata and counts for the vector collection."""
    try:
        create_collection()
        q_client = get_client()
        info = q_client.get_collection(collection_name=COLLECTION_NAME)
        return {
            "collection_name": COLLECTION_NAME,
            "status": str(info.status),
            "points_count": info.points_count or 0,
            "vector_size": settings.EMBEDDING_DIMENSION
        }
    except Exception as e:
        return {
            "collection_name": COLLECTION_NAME,
            "status": "error",
            "error": str(e),
            "points_count": 0
        }