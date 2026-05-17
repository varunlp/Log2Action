"""
Document Management API — Upload (multi-format), List, Delete.
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.domain import Document, DocumentChunk, User
from app.services.rag import rag_service
from app.services.ingestion import parse_document, validate_file, get_file_type
from app.api.deps import get_current_active_user

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a document (PDF, DOCX, TXT, MD, LOG).
    The document will be parsed, chunked, embedded, and stored in the vector database.
    """
    # Validate file extension
    if not validate_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: .pdf, .docx, .txt, .md, .log"
        )
    
    try:
        content = await file.read()
        
        # Validate file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10 MB.")
        
        # Parse document based on type
        raw_text = parse_document(file.filename, content)
        
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Document appears to be empty or unreadable.")
        
        # Create Document parent record
        file_type = get_file_type(file.filename)
        db_doc = Document(
            filename=file.filename,
            file_type=file_type,
            uploaded_by=current_user.id
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
        # Pass to RAG Service for chunking and embedding
        chunks_created = await rag_service.ingest_document(
            filename=file.filename,
            content=raw_text,
            db=db,
            document_id=db_doc.id,
            user_id=current_user.id
        )
        
        # Update chunk count
        db_doc.chunk_count = chunks_created
        db.commit()
        
        return {
            "id": db_doc.id,
            "filename": file.filename,
            "file_type": file_type,
            "chunks_created": chunks_created,
            "message": f"Successfully processed {file.filename} into {chunks_created} vector chunks."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing document upload: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all uploaded documents with metadata.
    """
    docs = (
        db.query(Document)
        .order_by(Document.created_at.desc())
        .all()
    )
    
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "chunk_count": doc.chunk_count,
            "uploaded_by": doc.owner.email if doc.owner else "system",
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        }
        for doc in docs
    ]


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a document and all its associated chunks.
    Cascade delete handles chunk cleanup.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Also delete any orphaned chunks by document_name (backward compat)
    db.query(DocumentChunk).filter(
        DocumentChunk.document_name == doc.filename,
        DocumentChunk.document_id.is_(None)
    ).delete()
    
    db.delete(doc)
    db.commit()
    
    return {"status": "success", "message": f"Deleted {doc.filename} and all associated chunks."}
