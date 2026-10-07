from typing import List, Dict, Any, Optional
from app.services.embedding import generate_embedding
from app.services.vectorstore import search_embeddings


def search_relevant_chunks(
    query: str,
    limit: int = 5,
    score_threshold: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Embed the user query and retrieve top matching chunks from Qdrant.
    """
    if not query or not query.strip():
        return []

    query_vector = generate_embedding(query.strip())
    results = search_embeddings(
        query_vector=query_vector,
        limit=limit,
        score_threshold=score_threshold
    )
    return results
