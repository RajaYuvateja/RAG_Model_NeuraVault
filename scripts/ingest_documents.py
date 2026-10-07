import sys
import os
import json
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.config.settings import settings
from app.services.ingestion import extract_document_text
from app.services.chunking import create_chunks
from app.services.indexing import index_chunks


def main():
    print("=== NeuraVault Ingestion Script ===")
    upload_dir = settings.UPLOAD_DIR
    processed_dir = settings.PROCESSED_DIR

    if not upload_dir.exists():
        print(f"Upload directory {upload_dir} does not exist.")
        return

    files = [f for f in upload_dir.iterdir() if f.is_file()]
    print(f"Found {len(files)} files in {upload_dir}")

    total_chunks = 0
    total_indexed = 0

    for file_path in files:
        print(f"\nProcessing: {file_path.name}")
        pages = extract_document_text(str(file_path))
        if not pages:
            print(f"  No text could be extracted from {file_path.name}")
            continue

        doc_chunks = []
        for page in pages:
            p_text = page.get("text", "")
            if not p_text:
                continue
            chunks = create_chunks(p_text)
            p_num = page.get("page", 1)
            for idx, c in enumerate(chunks):
                doc_chunks.append({
                    "chunk_id": f"{p_num}_{idx}",
                    "page": p_num,
                    "text": c,
                    "source": file_path.name
                })

        output_file = processed_dir / f"{file_path.name}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(doc_chunks, f, indent=4, ensure_ascii=False)

        indexed = index_chunks(doc_chunks)
        print(f"  Extracted {len(pages)} pages/sections -> {len(doc_chunks)} chunks -> {indexed} indexed in Qdrant.")
        total_chunks += len(doc_chunks)
        total_indexed += indexed

    print(f"\nCompleted ingestion. Total chunks: {total_chunks}, Total indexed: {total_indexed}")


if __name__ == "__main__":
    main()
