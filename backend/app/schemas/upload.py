from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    filename: str
    status: str
    pages: Optional[int] = 0
    chunks: Optional[int] = 0
    indexed: Optional[int] = 0
    message: Optional[str] = "Success"
