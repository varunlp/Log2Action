"""
Document Ingestion Service — Parses PDF, DOCX, TXT, MD files into raw text.
"""
import io
from pathlib import Path


ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt', '.md', '.log'}


def get_file_type(filename: str) -> str:
    """Return normalized file extension without dot."""
    ext = Path(filename).suffix.lower()
    return ext.lstrip('.')


def validate_file(filename: str) -> bool:
    """Check if file extension is supported."""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


def parse_document(filename: str, content: bytes) -> str:
    """
    Route to the correct parser based on file extension.
    Returns raw text content.
    """
    ext = Path(filename).suffix.lower()
    
    if ext == '.pdf':
        return parse_pdf(content)
    elif ext == '.docx':
        return parse_docx(content)
    elif ext in ('.txt', '.md', '.log'):
        return content.decode('utf-8', errors='ignore')
    else:
        raise ValueError(f"Unsupported file type: {ext}. Allowed: {ALLOWED_EXTENSIONS}")


def parse_pdf(content: bytes) -> str:
    """Extract text from PDF using PyPDF2."""
    from PyPDF2 import PdfReader
    
    reader = PdfReader(io.BytesIO(content))
    texts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            texts.append(page_text)
    
    return "\n\n".join(texts)


def parse_docx(content: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    from docx import Document
    
    doc = Document(io.BytesIO(content))
    texts = []
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            texts.append(paragraph.text)
    
    return "\n\n".join(texts)
