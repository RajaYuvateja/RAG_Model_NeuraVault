from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class DocumentInfo(BaseModel):
    filename: str
    size_bytes: int
    modified_time: str
    is_processed: bool
    chunks_count: int
    is_pdf: bool


class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total_count: int
    total_chunks: int
