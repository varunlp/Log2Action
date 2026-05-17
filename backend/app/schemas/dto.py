from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class TextAnalyzeRequest(BaseModel):
    text: str


class AnalysisResultSchema(BaseModel):
    issue_summary: str
    severity: str
    root_cause: Optional[str] = None
    remediation: Optional[str] = None

class LogUploadResponse(BaseModel):
    id: int
    filename: str
    analysis: AnalysisResultSchema
    
    class Config:
        from_attributes = True


# ── Chat Schemas ──

class ChatRequest(BaseModel):
    text: str
    mode: str = "auto"  # "auto" | "log_analysis" | "knowledge"

class SourceCitation(BaseModel):
    document_name: str
    chunk_id: int
    preview: str

class ChatResponse(BaseModel):
    mode: str  # "log_analysis" | "knowledge"
    # Log analysis fields (present when mode == "log_analysis")
    analysis: Optional[AnalysisResultSchema] = None
    # Knowledge fields (present when mode == "knowledge")
    answer: Optional[str] = None
    confidence: Optional[str] = None
    # Common fields
    sources: List[SourceCitation] = []
    input_text: Optional[str] = None
    filename: Optional[str] = None

class ChatHistoryItem(BaseModel):
    id: int
    mode: str
    input_text: str
    input_filename: Optional[str] = None
    response_data: Optional[dict] = None
    sources: Optional[list] = None
    created_at: Optional[str] = None

class DocumentInfo(BaseModel):
    id: int
    filename: str
    file_type: str
    chunk_count: int
    created_at: Optional[str] = None
