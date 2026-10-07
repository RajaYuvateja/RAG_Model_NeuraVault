from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings:
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "data" / "processed"
    VECTORSTORE_PATH: Path = BASE_DIR / "vectorstore"
    
    COLLECTION_NAME: str = "neuravault"
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()

# Ensure critical directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
settings.VECTORSTORE_PATH.mkdir(parents=True, exist_ok=True)