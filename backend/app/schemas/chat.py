from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class ChatRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    conversation_id: Optional[str] = None


class SourceCitation(BaseModel):
    id: Optional[str] = None
    score: float
    text: str
    source: str
    page: Optional[int] = 1
    chunk_id: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    query: str
    answer: str
    sources: List[SourceCitation]
    total_sources: int
