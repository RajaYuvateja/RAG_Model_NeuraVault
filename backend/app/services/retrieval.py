import re
from typing import List, Dict, Any, Optional
from app.services.embedding import generate_embedding
from app.services.vectorstore import search_embeddings


def calculate_relevance_label(score: float) -> str:
    """Label cosine similarity score into clear, interpretable qualitative tiers."""
    if score >= 0.55:
        return "High Relevance"
    elif score >= 0.35:
        return "Moderate Relevance"
    elif score >= 0.20:
        return "Low Relevance"
    else:
        return "Borderline"


def search_relevant_chunks(
    query: str,
    limit: int = 5,
    score_threshold: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Embed the user query and retrieve top matching chunks from Qdrant with verified metadata.
    """
    cleaned_query = query.strip() if query else ""
    if not cleaned_query:
        return []

    query_vector = generate_embedding(cleaned_query)
    results = search_embeddings(
        query_vector=query_vector,
        limit=limit,
        score_threshold=score_threshold
    )

    # Attach verified metadata and qualitative relevance label
    for item in results:
        score = float(item.get("score", 0.0))
        item["score_type"] = "cosine_similarity"
        item["relevance_label"] = calculate_relevance_label(score)
        
        # Ensure page is preserved as int or None (never fabricated)
        payload = item.get("payload") or {}
        raw_page = payload.get("page") if "page" in payload else item.get("page")
        item["page"] = int(raw_page) if raw_page is not None else None

    return results
