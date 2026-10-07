from fastapi import APIRouter
from app.services.vectorstore import get_collection_stats
from app.config.settings import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """System health check endpoint."""
    v_stats = get_collection_stats()

    return {
        "status": "healthy",
        "service": "NeuraVault API",
        "version": "1.0.0",
        "vectorstore": v_stats,
        "directories": {
            "uploads_configured": settings.UPLOAD_DIR.exists(),
            "processed_configured": settings.PROCESSED_DIR.exists(),
            "vectorstore_configured": settings.VECTORSTORE_PATH.exists()
        }
    }
