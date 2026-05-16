from abc import ABC, abstractmethod
from typing import List

class BaseAIProvider(ABC):
    """
    Abstract base class for all AI providers to ensure our system remains vendor-agnostic.
    """
    
    @abstractmethod
    def __init__(self, api_key: str | None = None, **kwargs):
        pass

    @abstractmethod
    async def analyze_log(self, log_content: str, context_docs: List[str] = None) -> str:
        """
        Analyze the log content and return a structured JSON response containing:
        - issue_summary
        - severity
        - root_cause
        - remediation
        """
        pass
    
    @abstractmethod
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate vector embeddings for an array of texts.
        Used for the RAG ingestion pipeline.
        """
        pass
