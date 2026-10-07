from sentence_transformers import SentenceTransformer
from typing import List, Union
from app.config.settings import settings

_model_instance = None


def get_embedding_model() -> SentenceTransformer:
    global _model_instance
    if _model_instance is None:
        _model_instance = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
    return _model_instance


# Keep module-level model attribute for backward compatibility
class _ModelProxy:
    def __getattr__(self, name):
        return getattr(get_embedding_model(), name)


model = _ModelProxy()


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embedding vectors for a list of text strings."""
    if not texts:
        return []
    emb_model = get_embedding_model()
    embeddings = emb_model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()


def generate_embedding(text: str) -> List[float]:
    """Generate a single embedding vector for a single text string."""
    if not text:
        text = " "
    emb_model = get_embedding_model()
    embedding = emb_model.encode(text, convert_to_numpy=True)
    return embedding.tolist()