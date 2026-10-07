from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse, SourceCitation
from app.services.retrieval import search_relevant_chunks
from app.services.llm import generate_rag_response

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
@router.post("/query", response_model=ChatResponse)
async def chat_query(request: ChatRequest):
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    top_k = request.top_k or 5

    # Retrieve relevant document chunks
    try:
        raw_chunks = search_relevant_chunks(request.query, limit=top_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval error: {e}")

    # Generate grounded RAG answer
    try:
        answer = generate_rag_response(request.query, raw_chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {e}")

    sources = [
        SourceCitation(
            id=c.get("id"),
            score=c.get("score", 0.0),
            text=c.get("text", ""),
            source=c.get("source", "unknown"),
            page=c.get("page", 1),
            chunk_id=c.get("chunk_id"),
            payload=c.get("payload")
        )
        for c in raw_chunks
    ]

    return ChatResponse(
        query=request.query,
        answer=answer,
        sources=sources,
        total_sources=len(sources)
    )
