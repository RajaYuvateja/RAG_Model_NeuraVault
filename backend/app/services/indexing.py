import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Union

from app.services.embedding import generate_embeddings, generate_embedding
from app.services.vectorstore import (
    client,
    create_collection,
    store_embeddings,
    COLLECTION_NAME
)


def index_chunks(chunks_data: Union[str, Path, List[Dict[str, Any]]]) -> int:
    """
    Index a list of chunk dictionaries or chunks loaded from a JSON file.
    Uses batch embedding generation and deterministic UUIDs to avoid point collisions.
    """
    chunks: List[Dict[str, Any]] = []

    if isinstance(chunks_data, (str, Path)):
        json_path = Path(chunks_data)
        if not json_path.exists():
            print(f"File {json_path} does not exist.")
            return 0
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                chunks = json.load(f)
        except Exception as e:
            print(f"Error reading JSON from {json_path}: {e}")
            return 0
    elif isinstance(chunks_data, list):
        chunks = chunks_data
    else:
        return 0

    if not chunks:
        return 0

    create_collection()

    # Extract text from chunks
    texts = [c.get("text", "") for c in chunks]

    # Batch generate embeddings (fast and vectorized)
    embeddings = generate_embeddings(texts)

    # Generate deterministic UUIDs per chunk to prevent overwrite conflicts
    ids = []
    for idx, c in enumerate(chunks):
        source = c.get("source", "doc")
        chunk_id = c.get("chunk_id", str(idx))
        unique_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{source}_{chunk_id}"))
        ids.append(unique_id)

    # Store in Qdrant
    indexed_count = store_embeddings(
        chunks=texts,
        embeddings=embeddings,
        payloads=chunks,
        ids=ids
    )

    return indexed_count