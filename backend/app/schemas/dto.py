from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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
