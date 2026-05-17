import json
from google import genai
from google.genai import types
from typing import List
from app.ai.base import BaseAIProvider

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str | None = None, **kwargs):
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required to initialize GeminiProvider")
        
        self.client = genai.Client(api_key=api_key)
        # Using the newest model
        self.model = 'gemini-2.5-flash'
        self.embedding_model = 'gemini-embedding-001'

    async def analyze_log(self, log_content: str, context_docs: List[str] = None) -> str:
        """
        Sends the log to Gemini and forces it to return JSON matching our schema.
        """
        system_prompt = (
            "You are an expert DevOps and Platform Engineering AI assistant. "
            "Your job is to analyze infrastructure and application logs, identify the root cause of failures, "
            "and suggest actionable remediations.\n\n"
            "You MUST return your response as a valid JSON object with the following schema:\n"
            "{\n"
            '  "issue_summary": "A concise 1-sentence summary of the problem",\n'
            '  "severity": "INFO" | "WARNING" | "ERROR" | "CRITICAL",\n'
            '  "root_cause": "Detailed explanation of what failed and why",\n'
            '  "remediation": "Step-by-step instructions to fix the issue"\n'
            "}\n"
        )
        
        if context_docs and len(context_docs) > 0:
            context_string = "\n\n".join(context_docs)
            system_prompt += (
                f"\n\nHere are some relevant internal runbooks/documents that might help resolve this issue:\n"
                f"--- BEGIN RUNBOOKS ---\n{context_string}\n--- END RUNBOOKS ---\n"
                "Use the runbooks to inform your root cause and remediation if applicable."
            )

        prompt = f"{system_prompt}\n\nHere is the raw log file to analyze:\n```\n{log_content}\n```"

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        
        return response.text

    async def answer_question(self, question: str, context_docs: List[str] = None) -> str:
        """
        Answers a knowledge-base question using RAG context from uploaded documents.
        """
        system_prompt = (
            "You are an expert enterprise knowledge assistant for a DevOps/Platform Engineering team. "
            "Your job is to answer questions about internal runbooks, SOPs, architecture documents, "
            "and operational procedures.\n\n"
            "You MUST return your response as a valid JSON object with the following schema:\n"
            "{\n"
            '  "answer": "Your detailed, helpful answer to the question",\n'
            '  "confidence": "HIGH" | "MEDIUM" | "LOW",\n'
            '  "sources_used": true | false\n'
            "}\n\n"
            "Guidelines:\n"
            "- If context documents are provided, use them to inform your answer and set sources_used to true.\n"
            "- If no relevant context is found, provide general best-practice advice and set confidence to LOW.\n"
            "- Be specific and actionable in your answers.\n"
            "- Reference specific document sections when possible.\n"
        )
        
        if context_docs and len(context_docs) > 0:
            context_string = "\n\n".join(context_docs)
            system_prompt += (
                f"\n\nHere are relevant internal documents from the knowledge base:\n"
                f"--- BEGIN DOCUMENTS ---\n{context_string}\n--- END DOCUMENTS ---\n"
                "Use these documents to answer the question accurately."
            )

        prompt = f"{system_prompt}\n\nUser Question: {question}"

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        
        return response.text

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Uses Gemini's embedding model to generate vectors for RAG.
        """
        response = await self.client.aio.models.embed_content(
            model=self.embedding_model,
            contents=texts,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=768
            )
        )
        
        # Extract the vector values from the embedding response
        return [e.values for e in response.embeddings]
