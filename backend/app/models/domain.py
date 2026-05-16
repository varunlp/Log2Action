from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
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
    documents = relationship("DocumentChunk", back_populates="owner")

class LogUpload(Base):
    __tablename__ = "log_uploads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # True for now to not break existing data
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

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    document_name = Column(String, index=True, nullable=False)
    chunk_text = Column(Text, nullable=False)
    # Using 768 dimensions as it's common for embeddings (Gemini/BERT). Can be adjusted.
    embedding = Column(Vector(768)) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="documents")
