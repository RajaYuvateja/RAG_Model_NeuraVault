import sys
import os
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

from app.config.settings import settings
from app.services.indexing import index_chunks
from app.services.vectorstore import get_collection_stats


def main():
    print("=== NeuraVault Reindex Script ===")
    processed_dir = settings.PROCESSED_DIR

    if not processed_dir.exists():
        print(f"Processed directory {processed_dir} does not exist.")
        return

    json_files = list(processed_dir.glob("*.json"))
    print(f"Found {len(json_files)} processed JSON files.")

    total_indexed = 0
    for jf in json_files:
        print(f"Indexing {jf.name}...")
        count = index_chunks(jf)
        print(f"  Indexed {count} chunks.")
        total_indexed += count

    stats = get_collection_stats()
    print(f"\nReindexing complete. Total chunks indexed: {total_indexed}")
    print(f"Collection stats: {stats}")


if __name__ == "__main__":
    main()
