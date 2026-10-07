from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.upload import router as upload_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.health import router as health_router
from app.services.vectorstore import create_collection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize vector collection on startup
    try:
        create_collection()
    except Exception as e:
        print(f"Warning: Failed to initialize Qdrant collection on startup: {e}")
    yield


app = FastAPI(
    title="NeuraVault",
    description="Enterprise Retrieval-Augmented Generation (RAG) Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(chat_router, prefix="/api", tags=["Chat & RAG"])
app.include_router(documents_router, prefix="/api", tags=["Documents"])
app.include_router(health_router, prefix="/api", tags=["Health"])


@app.get("/")
def root():
    return {
        "message": "NeuraVault API Running",
        "version": "1.0.0",
        "docs_url": "/docs"
    }