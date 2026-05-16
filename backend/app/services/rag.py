from sqlalchemy.orm import Session
from sqlalchemy import select
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List

from app.models.domain import DocumentChunk
from app.ai.factory import get_ai_provider

class RAGService:
    def __init__(self):
        # We split text into chunks of 1000 characters, with 200 chars overlap
        # to ensure context isn't lost between chunks.
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

    async def ingest_document(self, filename: str, content: str, db: Session):
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
        Generates an embedding for the query and finds the closest chunks in pgvector.
        """
        ai_provider = get_ai_provider()
        
        # 1. Embed the query (the log summary or raw log chunk)
        query_embeddings = await ai_provider.generate_embeddings([query])
        query_vector = query_embeddings[0]
        
        # 2. Perform Cosine Similarity search in pgvector
        # The <-> operator in pgvector is L2 distance, <=> is cosine distance
        # We will use cosine distance (smaller is closer)
        stmt = select(DocumentChunk).order_by(
            DocumentChunk.embedding.cosine_distance(query_vector)
        ).limit(limit)
        
        results = db.execute(stmt).scalars().all()
        
        # 3. Return the raw text of the most relevant chunks
        return [chunk.chunk_text for chunk in results]

rag_service = RAGService()
