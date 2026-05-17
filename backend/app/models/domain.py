from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)  # Admin must approve
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    logs = relationship("LogUpload", back_populates="owner")
    documents = relationship("Document", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="owner")

class LogUpload(Base):
    __tablename__ = "log_uploads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String, index=True, nullable=False)
    raw_content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="logs")
    analysis = relationship("AnalysisResult", back_populates="log_upload", uselist=False)

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    log_upload_id = Column(Integer, ForeignKey("log_uploads.id"), unique=True)
    
    # Structured AI response fields
    issue_summary = Column(Text, nullable=False)
    severity = Column(String, nullable=False)  # e.g., INFO, WARNING, ERROR, CRITICAL
    root_cause = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    log_upload = relationship("LogUpload", back_populates="analysis")

class Document(Base):
    """Parent record for an uploaded document (PDF, DOCX, TXT, MD)."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt, md
    chunk_count = Column(Integer, default=0)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    # Keep user_id for backward compat with existing data
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    document_name = Column(String, index=True, nullable=False)
    chunk_text = Column(Text, nullable=False)
    # Using 768 dimensions as it's common for embeddings (Gemini/BERT)
    embedding = Column(Vector(768)) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    document = relationship("Document", back_populates="chunks")

class ChatMessage(Base):
    """Unified chat history — stores both log analysis and knowledge Q&A."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mode = Column(String, nullable=False)  # "log_analysis" or "knowledge"
    input_text = Column(Text, nullable=False)
    input_filename = Column(String, nullable=True)  # if file was uploaded
    response_text = Column(Text, nullable=True)
    response_data = Column(JSON, nullable=True)  # structured AI response
    sources = Column(JSON, nullable=True)  # [{document_name, chunk_text, score}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="chat_messages")
