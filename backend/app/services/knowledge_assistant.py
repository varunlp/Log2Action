"""
Knowledge Assistant Service — Q&A pipeline using RAG for enterprise knowledge retrieval.
"""
import json
from sqlalchemy.orm import Session
from app.ai.factory import get_ai_provider
from app.services.rag import rag_service


async def answer_knowledge_query(
    question: str,
    user_id: int,
    db: Session
) -> dict:
    """
    Knowledge assistant pipeline:
    1. Retrieve relevant docs via hybrid search
    2. Call AI provider with Q&A prompt
    3. Return answer with source citations

    Returns dict with: mode, answer, confidence, sources[]
    """
    # 1. Hybrid RAG Retrieval
    context_chunks = await rag_service.hybrid_retrieve(question, db, limit=5, user_id=user_id)
    context_docs = [c.text for c in context_chunks]
    
    # Build source citations
    sources = []
    seen_docs = set()
    for c in context_chunks:
        if c.document_name not in seen_docs:
            seen_docs.add(c.document_name)
            sources.append({
                "document_name": c.document_name,
                "chunk_id": c.chunk_id,
                "preview": c.text[:150] + "..." if len(c.text) > 150 else c.text
            })
    
    # 2. Call AI Provider
    ai_provider = get_ai_provider()
    ai_response_text = await ai_provider.answer_question(question, context_docs=context_docs)
    
    # 3. Parse AI Response
    try:
        clean_json = ai_response_text.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(clean_json)
    except json.JSONDecodeError:
        # If AI returns plain text, wrap it
        parsed_data = {
            "answer": ai_response_text,
            "confidence": "MEDIUM",
            "sources_used": len(context_docs) > 0
        }
    
    return {
        "mode": "knowledge",
        "answer": parsed_data.get("answer", "I couldn't find relevant information."),
        "confidence": parsed_data.get("confidence", "MEDIUM"),
        "sources_used": parsed_data.get("sources_used", False),
        "sources": sources
    }
