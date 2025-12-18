# app/services/content/content_analyzer.py
from typing import List, Dict, Any, Optional
import re
from app.services.llm.llm_service import LLMService, get_llm_service
from app.services.llm.prompt_templates import PromptTemplates  # Assuming this exists; inline if not
from app.services.content.file_processor import FileProcessor
from app.core.logging import get_logger
from langchain_text_splitters import RecursiveCharacterTextSplitter
from fastapi import HTTPException

logger = get_logger(__name__)


class ContentAnalyzer:
    """Service for analyzing and chunking content."""

    def __init__(self, llm: Optional[LLMService] = None):
        # Reuse a cached LLMService instance to avoid expensive
        # client initialization on every request.
        self.llm = llm or get_llm_service()
        self.prompts = PromptTemplates()
        self.file_processor = FileProcessor()

    async def chunk_content(
        self,
        content: str,
        chunk_size: int = 1500,
        overlap: int = 200
    ) -> List[str]:
        """Split content into meaningful chunks using Langchain."""
        try:
            content = self._clean_text(content)

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=overlap,
                separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""]
            )
            chunks = splitter.split_text(content)

            min_chunk_size = 50
            filtered_chunks = [chunk for chunk in chunks if len(chunk) > min_chunk_size]

            logger.info(f"Content split into {len(filtered_chunks)} chunks")
            return filtered_chunks if filtered_chunks else [content]

        except Exception as e:
            logger.error(f"Chunking error: {repr(e)}", exc_info=True)
            return [content]

    def _clean_text(self, text: str) -> str:
        """Basic text cleaning."""
        text = re.sub(r'\s+', ' ', text).strip()
        text = re.sub(r'\n+', '\n', text).strip()
        return text

    async def generate_content_from_topic(self, topic: str) -> str:
        """Generate educational content from a topic."""
        try:
            prompt = self.prompts.generate_topic_content_prompt(topic)
            content = await self.llm.generate_text(prompt, temperature=0.7)
            logger.info(f"Generated content for topic: {topic}")
            return content
        except Exception as e:
            logger.error(f"Topic content generation error: {repr(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to generate content from topic")

    async def get_file_content(self, file_id: str) -> str:
        """Get content from uploaded file via FileProcessor."""
        return await self.file_processor.get_file_content(file_id)

    async def extract_key_concepts(self, content: str) -> List[str]:
        """Extract key concepts from content."""
        try:
            prompt = f"""Extract 5-10 key concepts or terms from the following content.

Content:
---
{content}
---

Return ONLY a valid JSON array of strings. Example: ["Concept 1", "Concept 2"]
"""
            concepts = await self.llm.generate_json(prompt, temperature=0.5)
            return concepts if isinstance(concepts, list) else []

        except Exception as e:
            logger.error(f"Concept extraction error: {repr(e)}", exc_info=True)
            return []