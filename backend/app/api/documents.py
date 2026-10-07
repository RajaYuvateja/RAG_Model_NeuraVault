import os
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from app.config.settings import settings
from app.services.indexing import index_chunks
from app.services.vectorstore import delete_document_points
from app.schemas.document import DocumentInfo, DocumentListResponse

router = APIRouter()

UPLOAD_DIR = settings.UPLOAD_DIR
PROCESSED_DIR = settings.PROCESSED_DIR


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    """List all uploaded documents and their processing status."""
    docs: List[DocumentInfo] = []
    total_chunks = 0

    if UPLOAD_DIR.exists():
        for file_path in UPLOAD_DIR.iterdir():
            if file_path.is_file():
                processed_file = PROCESSED_DIR / f"{file_path.name}.json"
                is_processed = processed_file.exists()
                chunks_count = 0

                if is_processed:
                    try:
                        with open(processed_file, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            chunks_count = len(data) if isinstance(data, list) else 0
                    except Exception:
                        chunks_count = 0

                total_chunks += chunks_count
                stat = file_path.stat()
                mtime = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

                docs.append(DocumentInfo(
                    filename=file_path.name,
                    size_bytes=stat.st_size,
                    modified_time=mtime,
                    is_processed=is_processed,
                    chunks_count=chunks_count,
                    is_pdf=file_path.suffix.lower() == ".pdf"
                ))

    # Sort newest first
    docs.sort(key=lambda d: d.modified_time, reverse=True)

    return DocumentListResponse(
        documents=docs,
        total_count=len(docs),
        total_chunks=total_chunks
    )


@router.get("/documents/{filename}/chunks")
async def get_document_chunks(filename: str):
    """Retrieve processed chunks for a given document."""
    safe_filename = Path(filename).name
    processed_file = PROCESSED_DIR / f"{safe_filename}.json"

    if not processed_file.exists():
        raise HTTPException(status_code=404, detail="Processed chunks not found for this document")

    try:
        with open(processed_file, "r", encoding="utf-8") as f:
            chunks = json.load(f)
        return {"filename": safe_filename, "chunks": chunks, "total": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read chunks: {e}")


@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Delete a document, its processed JSON, and its vectors from Qdrant."""
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    processed_file = PROCESSED_DIR / f"{safe_filename}.json"

    deleted_upload = False
    deleted_processed = False

    if file_path.exists():
        file_path.unlink()
        deleted_upload = True

    if processed_file.exists():
        processed_file.unlink()
        deleted_processed = True

    # Delete vectors from Qdrant
    deleted_vectors = delete_document_points(safe_filename)

    if not deleted_upload and not deleted_processed:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "filename": safe_filename,
        "deleted_upload": deleted_upload,
        "deleted_processed": deleted_processed,
        "deleted_vectors": deleted_vectors,
        "message": f"Successfully removed {safe_filename} and associated vectors"
    }


@router.post("/documents/reindex")
async def reindex_all_documents():
    """Re-index all processed documents into Qdrant."""
    indexed_files = 0
    total_chunks_indexed = 0

    if PROCESSED_DIR.exists():
        for json_file in PROCESSED_DIR.glob("*.json"):
            count = index_chunks(json_file)
            if count > 0:
                indexed_files += 1
                total_chunks_indexed += count

    return {
        "status": "success",
        "indexed_files": indexed_files,
        "total_chunks_indexed": total_chunks_indexed,
        "message": f"Indexed {total_chunks_indexed} chunks across {indexed_files} files."
    }
