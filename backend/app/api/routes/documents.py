from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.services.rag import rag_service

router = APIRouter()

class DocumentUploadResponse(BaseModel):
    filename: str
    chunks_created: int
    message: str

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a runbook or architecture document.
    The document will be chunked, embedded, and stored in the vector database.
    """
    try:
        content = await file.read()
        raw_text = content.decode("utf-8", errors="ignore")
        
        # Pass to the RAG Service for chunking and embedding
        chunks_created = await rag_service.ingest_document(
            filename=file.filename,
            content=raw_text,
            db=db
        )
        
        return DocumentUploadResponse(
            filename=file.filename,
            chunks_created=chunks_created,
            message=f"Successfully processed {file.filename} into {chunks_created} vector chunks."
        )
        
    except Exception as e:
        print(f"Error processing document upload: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
