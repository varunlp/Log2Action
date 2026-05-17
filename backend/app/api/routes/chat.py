"""
Unified Chat API — Routes to log analysis or knowledge assistant based on intent.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.domain import ChatMessage, User
from app.schemas.dto import ChatRequest, ChatResponse, ChatHistoryItem
from app.api.deps import get_current_active_user
from app.services.intent_router import detect_intent, IntentType
from app.services.log_analysis import analyze_log_content
from app.services.knowledge_assistant import answer_knowledge_query

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Unified chat endpoint.
    - mode="auto": Uses intent router to detect log analysis vs knowledge query
    - mode="log_analysis": Forces log analysis pipeline
    - mode="knowledge": Forces knowledge assistant pipeline
    """
    text = request.text
    mode = request.mode
    
    # Determine intent
    if mode == "auto":
        intent = detect_intent(text)
        mode = intent.value
    
    try:
        if mode == "log_analysis":
            result = await analyze_log_content(
                raw_text=text,
                filename="Pasted_Text",
                user_id=current_user.id,
                db=db
            )
            
            # Save to chat history
            chat_msg = ChatMessage(
                user_id=current_user.id,
                mode="log_analysis",
                input_text=text[:500],
                response_data=result.get("analysis"),
                sources=result.get("sources", [])
            )
            db.add(chat_msg)
            db.commit()
            
            return ChatResponse(
                mode="log_analysis",
                analysis=result.get("analysis"),
                sources=result.get("sources", []),
                input_text=text[:200]
            )
        
        else:  # knowledge
            result = await answer_knowledge_query(
                question=text,
                user_id=current_user.id,
                db=db
            )
            
            # Save to chat history
            chat_msg = ChatMessage(
                user_id=current_user.id,
                mode="knowledge",
                input_text=text[:500],
                response_text=result.get("answer"),
                response_data={
                    "answer": result.get("answer"),
                    "confidence": result.get("confidence")
                },
                sources=result.get("sources", [])
            )
            db.add(chat_msg)
            db.commit()
            
            return ChatResponse(
                mode="knowledge",
                answer=result.get("answer"),
                confidence=result.get("confidence"),
                sources=result.get("sources", []),
                input_text=text[:200]
            )
    
    except Exception as e:
        print(f"[CHAT] Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def chat_with_file(
    file: UploadFile = File(...),
    mode: str = Form(default="log_analysis"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Chat with a file upload — primarily for log analysis.
    """
    try:
        content = await file.read()
        raw_text = content.decode("utf-8", errors="ignore")
        
        result = await analyze_log_content(
            raw_text=raw_text,
            filename=file.filename,
            user_id=current_user.id,
            db=db
        )
        
        # Save to chat history
        chat_msg = ChatMessage(
            user_id=current_user.id,
            mode="log_analysis",
            input_text=raw_text[:500],
            input_filename=file.filename,
            response_data=result.get("analysis"),
            sources=result.get("sources", [])
        )
        db.add(chat_msg)
        db.commit()
        
        return ChatResponse(
            mode="log_analysis",
            analysis=result.get("analysis"),
            sources=result.get("sources", []),
            input_text=raw_text[:200],
            filename=file.filename
        )
    
    except Exception as e:
        print(f"[CHAT] File upload error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def get_chat_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns the user's recent chat history across both modes.
    """
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )
    
    return [
        {
            "id": msg.id,
            "mode": msg.mode,
            "input_text": msg.input_text,
            "input_filename": msg.input_filename,
            "response_data": msg.response_data,
            "sources": msg.sources,
            "created_at": msg.created_at.isoformat() if msg.created_at else None
        }
        for msg in messages
    ]


@router.delete("/history")
def clear_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Clears the current user's entire chat history.
    """
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "Chat history cleared."}

