import json
import asyncio
import random
from typing import List
from app.ai.base import BaseAIProvider

class MockProvider(BaseAIProvider):
    """
    A smart mock AI provider that uses RAG context (runbook docs) to generate
    realistic-looking responses WITHOUT needing any external API key.
    
    Perfect for office demos and local testing.
    """
    def __init__(self, **kwargs):
        pass

    async def analyze_log(self, log_content: str, context_docs: List[str] = None) -> str:
        """
        Simulates AI processing. If RAG context is provided, it uses the
        runbook content to build a detailed, context-aware response.
        """
        await asyncio.sleep(2)  # Simulate AI thinking time
        
        # Detect severity from log keywords
        severity = "INFO"
        lower_log = log_content.lower()
        if "fatal" in lower_log or "critical" in lower_log or "oom" in lower_log or "killed" in lower_log:
            severity = "CRITICAL"
        elif "error" in lower_log or "failed" in lower_log or "exception" in lower_log or "traceback" in lower_log:
            severity = "ERROR"
        elif "warn" in lower_log or "timeout" in lower_log or "retry" in lower_log:
            severity = "WARNING"

        # Extract a meaningful snippet from the log
        lines = log_content.strip().split('\n')
        key_line = log_content[:150]
        for line in lines:
            ll = line.lower()
            if any(kw in ll for kw in ['error', 'exception', 'failed', 'fatal', 'critical', 'traceback']):
                key_line = line.strip()[:200]
                break

        # Build the response using RAG context if available
        if context_docs and len(context_docs) > 0 and context_docs[0].strip():
            combined_context = "\n".join(context_docs[:2])
            
            # Extract actionable sentences — filter out separators, short/garbage lines
            raw_sentences = combined_context.replace('\n', '. ').split('. ')
            context_sentences = []
            for s in raw_sentences:
                cleaned = s.strip().strip('=').strip('-').strip('*').strip('#').strip()
                if len(cleaned) < 25:
                    continue
                if all(c in '=-_*#~' for c in cleaned):
                    continue
                context_sentences.append(cleaned)
            
            seen = set()
            remediation_steps = []
            for sentence in context_sentences:
                if sentence not in seen and len(remediation_steps) < 5:
                    seen.add(sentence)
                    remediation_steps.append(f"{len(remediation_steps)+1}. {sentence}")
            
            if not remediation_steps:
                remediation_steps = ["1. Review the uploaded runbook for guidance.", "2. Check the service configuration.", "3. Restart the affected component."]

            mock_response = {
                "issue_summary": f"Detected {severity}-level issue in submitted log: {key_line[:120]}",
                "severity": severity,
                "root_cause": (
                    f"Log analysis identified the following failure pattern:\n"
                    f"\"{key_line}\"\n\n"
                    f"Based on your internal runbook, this matches a known operational pattern. "
                    f"The system cross-referenced {len(context_docs)} relevant document chunk(s) from "
                    f"your knowledge base to provide context-aware diagnosis."
                ),
                "remediation": (
                    "Based on your internal runbooks, the recommended steps are:\n\n" +
                    "\n".join(remediation_steps) +
                    "\n\n(Analysis powered by RAG-retrieved context from your uploaded documents.)"
                )
            }
        else:
            mock_response = {
                "issue_summary": f"Detected {severity}-level issue: {key_line[:120]}",
                "severity": severity,
                "root_cause": (
                    f"Log analysis identified the following failure pattern:\n"
                    f"\"{key_line}\"\n\n"
                    f"No internal runbooks were found in the knowledge base. "
                    f"Upload relevant runbooks via the Admin Console to get context-aware diagnosis."
                ),
                "remediation": (
                    "1. Check the service logs for additional context.\n"
                    "2. Verify environment variables and configuration.\n"
                    "3. Restart the affected service.\n"
                    "4. Upload internal runbooks to the Knowledge Base for smarter AI diagnosis."
                )
            }
        
        return json.dumps(mock_response)

    async def answer_question(self, question: str, context_docs: List[str] = None) -> str:
        """
        Simulates knowledge assistant Q&A using RAG context.
        Builds a realistic answer from the retrieved document chunks.
        """
        await asyncio.sleep(1.5)  # Simulate AI thinking time
        
        if context_docs and len(context_docs) > 0 and context_docs[0].strip():
            combined_context = "\n".join(context_docs[:3])
            
            # Extract meaningful sentences from context
            raw_sentences = combined_context.replace('\n', '. ').split('. ')
            useful_sentences = []
            for s in raw_sentences:
                cleaned = s.strip().strip('=').strip('-').strip('*').strip('#').strip()
                if len(cleaned) >= 30 and not all(c in '=-_*#~' for c in cleaned):
                    useful_sentences.append(cleaned)
            
            # Build a coherent answer from context
            if useful_sentences:
                answer_parts = []
                answer_parts.append(f"Based on your internal documentation, here is what I found regarding your question:\n")
                
                for i, sentence in enumerate(useful_sentences[:6]):
                    answer_parts.append(f"• {sentence}")
                
                answer_parts.append(f"\nThis information was retrieved from {len(context_docs)} relevant document chunk(s) in your knowledge base.")
                
                answer = "\n".join(answer_parts)
                confidence = "HIGH"
            else:
                answer = (
                    "I found relevant documents in your knowledge base but couldn't extract "
                    "specific information for your question. Try rephrasing your query or "
                    "uploading more detailed documentation."
                )
                confidence = "LOW"
        else:
            answer = (
                "I don't have any relevant documents in the knowledge base to answer this question.\n\n"
                "To get accurate answers:\n"
                "1. Upload your runbooks, SOPs, or documentation via the Admin Console.\n"
                "2. The system will automatically index them for future queries.\n"
                "3. Then ask your question again for a context-aware answer."
            )
            confidence = "LOW"
        
        mock_response = {
            "answer": answer,
            "confidence": confidence,
            "sources_used": bool(context_docs and len(context_docs) > 0)
        }
        
        return json.dumps(mock_response)

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates deterministic pseudo-embeddings based on text content.
        This allows RAG cosine similarity to actually return relevant chunks
        (not just random ones) — making the demo realistic.
        """
        embeddings = []
        for text in texts:
            vec = [0.0] * 768
            for i, char in enumerate(text.lower()):
                idx = (ord(char) * (i + 1)) % 768
                vec[idx] += 0.01
            
            magnitude = sum(v ** 2 for v in vec) ** 0.5
            if magnitude > 0:
                vec = [v / magnitude for v in vec]
            
            embeddings.append(vec)
        
        return embeddings
