import os
from typing import List, Dict, Any, Optional
from app.config.settings import settings


def format_context_prompt(query: str, context_chunks: List[Dict[str, Any]]) -> str:
    """Format prompt with retrieved context and source citations."""
    context_text = ""
    for i, chunk in enumerate(context_chunks, 1):
        src = chunk.get("source", "document")
        page = chunk.get("page", 1)
        text = chunk.get("text", "")
        context_text += f"\n[Document {i}: {src} (Page {page})]\n{text}\n"

    prompt = (
        f"You are NeuraVault, an enterprise intelligent retrieval-augmented assistant.\n"
        f"Answer the user's question accurately using ONLY the provided context excerpts.\n"
        f"Cite sources when referencing information (e.g., [Source: filename (Page X)]).\n"
        f"If the answer cannot be determined from the context, state that clearly.\n\n"
        f"--- CONTEXT ---\n{context_text}\n"
        f"--- QUESTION ---\n{query}\n\n"
        f"--- ANSWER ---"
    )
    return prompt


def generate_rag_response(
    query: str,
    context_chunks: List[Dict[str, Any]]
) -> str:
    """
    Generate an answer using OpenAI LLM if configured,
    or synthesize a grounded answer directly from retrieved chunks.
    """
    if not context_chunks:
        return "No relevant documents or information found in NeuraVault for your query. Please upload documents to the vault."

    # Try OpenAI if API key is provided
    api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
    if api_key and api_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            prompt = format_context_prompt(query, context_chunks)
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are NeuraVault Enterprise RAG Assistant. Provide accurate, well-cited answers grounded in the provided document context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=800
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI generation error: {e}. Falling back to local synthesis.")

    # Local grounded synthesis fallback
    top_chunk = context_chunks[0]
    sources_summary = []
    seen_sources = set()
    for c in context_chunks[:3]:
        s = f"{c.get('source', 'doc')} (Page {c.get('page', 1)})"
        if s not in seen_sources:
            seen_sources.add(s)
            sources_summary.append(s)

    sources_str = ", ".join(sources_summary)
    
    # Formulate a structured extractive answer from top chunks
    answer_parts = [
        f"Based on the most relevant information retrieved from **{sources_str}**:\n"
    ]
    
    for i, c in enumerate(context_chunks[:3], 1):
        txt = c.get("text", "").strip()
        src = c.get("source", "doc")
        pg = c.get("page", 1)
        score = c.get("score", 0.0)
        score_pct = f"{score * 100:.1f}%" if score <= 1.0 else f"{score:.2f}"
        
        # Take key sentences
        lines = [line.strip() for line in txt.split("\n") if line.strip()]
        snippet = " ".join(lines[:4])
        if len(snippet) > 300:
            snippet = snippet[:297] + "..."
            
        answer_parts.append(f"- **From {src} (Page {pg}, Relevance: {score_pct})**:\n  > {snippet}\n")

    return "\n".join(answer_parts)
