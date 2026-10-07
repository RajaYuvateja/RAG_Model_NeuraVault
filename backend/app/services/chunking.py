from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter


def create_chunks(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> List[str]:
    """Split text into overlapping semantic chunks."""
    if not text or not text.strip():
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = splitter.split_text(text.strip())
    return [c.strip() for c in chunks if c.strip()]