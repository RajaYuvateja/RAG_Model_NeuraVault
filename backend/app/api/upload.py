import json
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config.settings import settings
from app.services.ingestion import extract_document_text
from app.services.chunking import create_chunks
from app.services.indexing import index_chunks
from app.services.vectorstore import delete_document_points
from app.schemas.upload import UploadResponse

router = APIRouter()

UPLOAD_DIR = settings.UPLOAD_DIR
PROCESSED_DIR = settings.PROCESSED_DIR


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty")

    # Sanitize filename
    safe_filename = Path(file.filename).name
    file_path = UPLOAD_DIR / safe_filename

    # Save uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Extract pages / sections
    pages = extract_document_text(str(file_path))
    all_chunks = []

    for page in pages:
        page_text = page.get("text", "")
        if not page_text:
            continue

        chunks = create_chunks(page_text)
        page_num = page.get("page")

        for idx, chunk in enumerate(chunks):
            cid = f"{page_num}_{idx}" if page_num is not None else f"c_{idx}"
            all_chunks.append({
                "chunk_id": cid,
                "page": page_num,
                "text": chunk,
                "source": safe_filename
            })

    output_file = PROCESSED_DIR / f"{safe_filename}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=4, ensure_ascii=False)

    # Purge existing vectors for this document to avoid duplicate or zombie points
    delete_document_points(safe_filename)

    # Automatically index chunks into Qdrant vector database
    indexed_count = 0
    if all_chunks:
        indexed_count = index_chunks(all_chunks)

    return UploadResponse(
        filename=safe_filename,
        status="success",
        pages=len(pages),
        chunks=len(all_chunks),
        indexed=indexed_count,
        message=f"Uploaded and indexed {indexed_count} chunks successfully."
    )