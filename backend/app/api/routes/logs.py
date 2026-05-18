from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
import json

from app.db.session import get_db
from app.models.domain import LogUpload, AnalysisResult, User
from app.schemas.dto import LogUploadResponse, TextAnalyzeRequest
from app.ai.factory import get_ai_provider
from app.api.deps import get_current_active_user

router = APIRouter()

@router.post("/upload", response_model=LogUploadResponse)
async def upload_log(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        content = await file.read()
        raw_text = content.decode("utf-8", errors="ignore")
        
        # 1. Save Raw Log to DB — tagged to the current user
        db_log = LogUpload(
            filename=file.filename,
            raw_content=raw_text,
            user_id=current_user.id
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        
        # 2. RAG Context Retrieval
        from app.services.rag import rag_service
        query_snippet = raw_text[:500]
        context_docs = await rag_service.retrieve_relevant_docs(
            query_snippet,
            db,
            limit=3,
            user_id=current_user.id
        )
        
        # 3. Call AI Provider
        ai_provider = get_ai_provider()
        ai_response_text = await ai_provider.analyze_log(raw_text, context_docs=context_docs)
        
        # 4. Parse AI Response
        try:
            clean_json = ai_response_text.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_json)
        except json.JSONDecodeError:
            print(f"Failed to parse AI response: {ai_response_text}")
            raise HTTPException(status_code=500, detail="AI response was not valid JSON")

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
        return db_log
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error processing upload: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-text", response_model=LogUploadResponse)
async def analyze_text(
    request: TextAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        raw_text = request.text
        
        # 1. Save Raw Log to DB
        db_log = LogUpload(
            filename="Pasted_Text",
            raw_content=raw_text,
            user_id=current_user.id
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        
        # 2. RAG Context Retrieval
        from app.services.rag import rag_service
        query_snippet = raw_text[:500]
        context_docs = await rag_service.retrieve_relevant_docs(
            query_snippet,
            db,
            limit=3,
            user_id=current_user.id
        )
        
        # 3. Call AI Provider
        ai_provider = get_ai_provider()
        ai_response_text = await ai_provider.analyze_log(raw_text, context_docs=context_docs)
        
        # 4. Parse AI Response
        try:
            clean_json = ai_response_text.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_json)
        except json.JSONDecodeError:
            print(f"Failed to parse AI response: {ai_response_text}")
            raise HTTPException(status_code=500, detail="AI response was not valid JSON")

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
        return db_log
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error processing text analysis: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def get_user_history(
    limit: int = 8,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns the last N log uploads (with analysis) for the current user.
    Light query: uses LIMIT, only fetches needed columns via joinedload.
    """
    logs = (
        db.query(LogUpload)
        .options(joinedload(LogUpload.analysis))
        .filter(LogUpload.user_id == current_user.id)
        .order_by(LogUpload.created_at.desc())
        .limit(limit)
        .all()
    )
    
    return [
        {
            "id": log.id,
            "filename": log.filename,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "analysis": {
                "severity": log.analysis.severity,
                "issue_summary": log.analysis.issue_summary,
                "root_cause": log.analysis.root_cause,
                "remediation": log.analysis.remediation,
            } if log.analysis else None
        }
        for log in logs
    ]
