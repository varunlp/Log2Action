"""
Log Analysis Service — Extracted pipeline for analyzing log content.
Reusable by both file upload and text input endpoints.
"""
import json
from sqlalchemy.orm import Session
from app.models.domain import LogUpload, AnalysisResult
from app.ai.factory import get_ai_provider
from app.services.rag import rag_service


async def analyze_log_content(
    raw_text: str,
    filename: str,
    user_id: int,
    db: Session
) -> dict:
    """
    Full log analysis pipeline:
    1. Save raw log to DB
    2. Retrieve RAG context
    3. Call AI provider
    4. Parse + save analysis result
    5. Return structured result

    Returns dict with: id, filename, analysis {issue_summary, severity, root_cause, remediation}
    """
    # 1. Save Raw Log to DB
    db_log = LogUpload(
        filename=filename,
        raw_content=raw_text,
        user_id=user_id
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    # 2. RAG Context Retrieval
    query_snippet = raw_text[:500]
    context_chunks = await rag_service.hybrid_retrieve(query_snippet, db, limit=3)
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
                "preview": c.text[:100] + "..." if len(c.text) > 100 else c.text
            })
    
    # 3. Call AI Provider
    ai_provider = get_ai_provider()
    ai_response_text = await ai_provider.analyze_log(raw_text, context_docs=context_docs)
    
    # 4. Parse AI Response
    try:
        clean_json = ai_response_text.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(clean_json)
    except json.JSONDecodeError:
        print(f"Failed to parse AI response: {ai_response_text}")
        raise ValueError("AI response was not valid JSON")

    # 5. Save Analysis Result to DB
    db_analysis = AnalysisResult(
        log_upload_id=db_log.id,
        issue_summary=parsed_data.get("issue_summary", "Unknown Error"),
        severity=parsed_data.get("severity", "ERROR"),
        root_cause=parsed_data.get("root_cause", ""),
        remediation=parsed_data.get("remediation", "")
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_log)
    
    return {
        "id": db_log.id,
        "filename": db_log.filename,
        "mode": "log_analysis",
        "analysis": {
            "issue_summary": db_analysis.issue_summary,
            "severity": db_analysis.severity,
            "root_cause": db_analysis.root_cause,
            "remediation": db_analysis.remediation,
        },
        "sources": sources
    }
