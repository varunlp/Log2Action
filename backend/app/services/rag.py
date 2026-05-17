"""
RAG Service — Ingestion + Hybrid Retrieval (Vector + Keyword) with source citations.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Optional
from dataclasses import dataclass

from app.models.domain import DocumentChunk, Document
from app.ai.factory import get_ai_provider


@dataclass
class RetrievedChunk:
    """A retrieved document chunk with source metadata."""
    text: str
    document_name: str
    chunk_id: int
    score: float = 0.0


class RAGService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

    async def ingest_document(
        self,
        filename: str,
        content: str,
        db: Session,
        document_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> int:
        """
        Splits a document, generates embeddings, and saves them to pgvector.
        """
        # 1. Split the document into chunks
        chunks = self.text_splitter.split_text(content)
        if not chunks:
            return 0
            
        # 2. Get the AI Provider
        ai_provider = get_ai_provider()
        
        # 3. Generate embeddings for all chunks in batch
        embeddings = await ai_provider.generate_embeddings(chunks)
        
        # 4. Save to Database
        db_chunks = []
        for i, chunk_text in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=document_id,
                user_id=user_id,
                document_name=filename,
                chunk_text=chunk_text,
                embedding=embeddings[i]
            )
            db_chunks.append(db_chunk)
            
        db.add_all(db_chunks)
        db.commit()
        
        return len(chunks)

    async def retrieve_relevant_docs(self, query: str, db: Session, limit: int = 3) -> List[str]:
        """
        Legacy method — returns raw text strings for backward compatibility
        with the existing log analysis pipeline.
        """
        chunks = await self.hybrid_retrieve(query, db, limit=limit)
        return [c.text for c in chunks]

    async def hybrid_retrieve(
        self,
        query: str,
        db: Session,
        limit: int = 5
    ) -> List[RetrievedChunk]:
        """
        Hybrid retrieval combining:
        1. Vector similarity search (cosine distance via pgvector)
        2. Keyword search (ILIKE for exact error codes / terms)
        
        Returns RetrievedChunk objects with source metadata.
        """
        results = {}
        
        # ── Vector Search ──
        try:
            ai_provider = get_ai_provider()
            query_embeddings = await ai_provider.generate_embeddings([query[:500]])
            query_vector = query_embeddings[0]
            
            vector_stmt = select(DocumentChunk).order_by(
                DocumentChunk.embedding.cosine_distance(query_vector)
            ).limit(limit)
            
            vector_results = db.execute(vector_stmt).scalars().all()
            
            for i, chunk in enumerate(vector_results):
                score = 1.0 - (i * 0.1)  # Approximate relevance score
                results[chunk.id] = RetrievedChunk(
                    text=chunk.chunk_text,
                    document_name=chunk.document_name,
                    chunk_id=chunk.id,
                    score=score
                )
        except Exception as e:
            print(f"[RAG] Vector search failed: {e}")
        
        # ── Keyword Search ──
        try:
            # Extract potential keywords (error codes, significant terms)
            keywords = self._extract_keywords(query)
            
            if keywords:
                for kw in keywords[:3]:  # Limit to top 3 keywords
                    kw_stmt = select(DocumentChunk).filter(
                        DocumentChunk.chunk_text.ilike(f"%{kw}%")
                    ).limit(limit)
                    
                    kw_results = db.execute(kw_stmt).scalars().all()
                    
                    for chunk in kw_results:
                        if chunk.id not in results:
                            results[chunk.id] = RetrievedChunk(
                                text=chunk.chunk_text,
                                document_name=chunk.document_name,
                                chunk_id=chunk.id,
                                score=0.7  # Keyword matches score slightly lower
                            )
        except Exception as e:
            print(f"[RAG] Keyword search failed: {e}")
        
        # Sort by score descending, return top N
        sorted_results = sorted(results.values(), key=lambda x: x.score, reverse=True)
        return sorted_results[:limit]

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract significant keywords for keyword search — error codes, specific terms."""
        import re
        keywords = []
        
        # Error codes like J2CA0045E, ORA-12541, SQLSTATE
        error_codes = re.findall(r'[A-Z]{2,8}[-]?\d{3,6}[A-Z]?', text)
        keywords.extend(error_codes)
        
        # Significant technical terms (3+ chars, not common words)
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'how', 'what', 'when', 'where', 'why', 'who', 'which', 'this', 'that', 'with', 'from', 'have', 'been'}
        words = re.findall(r'\b[a-zA-Z_]{4,}\b', text)
        for word in words:
            if word.lower() not in stop_words and word not in keywords:
                keywords.append(word)
                if len(keywords) >= 5:
                    break
        
        return keywords


rag_service = RAGService()
