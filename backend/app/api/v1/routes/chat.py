from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import asyncio
from app.api.v1.dependencies import get_current_user_id
# --- CORRECTED IMPORTS ---
from app.services.llm.llm_service import get_llm_service  # Use cached generic LLM service
from app.services.rag.retriever import Retriever
from app.services.content.file_processor import FileProcessor  # Use generic file processor
# -------------------------
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


class ChatMessage(BaseModel):
    message: str
    file_id: Optional[str] = None
    lesson_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    # sources: List[dict] = [] # You might want to implement source tracking later


@router.post("/", response_model=ChatResponse)
async def chat_with_content(
    chat: ChatMessage,
    user_id: str = Depends(get_current_user_id)
):
    """Chat with PDF or lesson content using RAG."""
    try:
        # --- USE CORRECTED SERVICE NAMES ---
        # Reuse cached LLM service instead of creating a new client per request
        llm = get_llm_service()
        retriever = Retriever()
        file_processor = FileProcessor()
        # ---------------------------------

        context = ""

        if chat.file_id:
            # Check if user has access to this file (enforced in FileProcessor.get_file_content)
            logger.info(f"Chat request for file_id: {chat.file_id} by user {user_id}")
            file_data = await file_processor.get_file_content(chat.file_id, user_id)
            # Extract plain text content for the LLM
            context = file_data.get('content', '')
        elif chat.lesson_id:
            # Check if user has access to this lesson (implicitly handled by RLS on lesson tables)
            logger.info(f"Chat request for lesson_id: {chat.lesson_id}")
            # Collection name might need user_id for isolation if using ChromaDB locally per user
            collection_name = f"lesson_{chat.lesson_id}_{user_id}" # Consider adding user_id
            context = await retriever.retrieve_relevant_context(
                query=chat.message,
                collection_name=collection_name,
                n_results=3 # Number of relevant chunks to retrieve
            )
        else:
             raise HTTPException(status_code=400, detail="Either file_id or lesson_id must be provided.")

        if not context:
            logger.warning(f"No context found for chat request: file_id={chat.file_id}, lesson_id={chat.lesson_id}")
            # Handle gracefully - either error or respond without context
            # Option 1: Error out
            # raise HTTPException(status_code=404, detail="Content not found or no relevant context retrieved.")
            # Option 2: Respond directly without RAG (might hallucinate)
            response_text = await llm.generate_text(prompt=chat.message)
            return {"response": response_text}


        logger.info(f"Generating chat response with context for user {user_id}")
        # Generate response using the LLM with the retrieved context
        response_text = await llm.generate_with_context(
            prompt=chat.message,
            context=context,
            temperature=0.7 # Or use settings.TEMPERATURE
        )

        # You could potentially return sources if the retriever provides them
        return {"response": response_text}

    except HTTPException:
        raise # Re-raise specific HTTP errors
    except Exception as e:
        logger.error(f"Chat endpoint error: {repr(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your chat request."
        )


@router.post("/stream")
async def chat_with_content_stream(
    chat: ChatMessage,
    user_id: str = Depends(get_current_user_id)
):
    """
    Stream chat responses for PDF/lesson chat using SSE-style chunks.
    We still generate the full reply, then chunk it for perceived responsiveness.
    """
    try:
        llm = get_llm_service()
        retriever = Retriever()
        file_processor = FileProcessor()

        context = ""

        if chat.file_id:
            logger.info(f"[stream] Chat request for file_id: {chat.file_id} by user {user_id}")
            file_data = await file_processor.get_file_content(chat.file_id, user_id)
            context = file_data.get('content', '')
        elif chat.lesson_id:
            logger.info(f"[stream] Chat request for lesson_id: {chat.lesson_id}")
            collection_name = f"lesson_{chat.lesson_id}_{user_id}"
            context = await retriever.retrieve_relevant_context(
                query=chat.message,
                collection_name=collection_name,
                n_results=3
            )
        else:
             raise HTTPException(status_code=400, detail="Either file_id or lesson_id must be provided.")

        if not context:
            response_text = await llm.generate_text(prompt=chat.message)
        else:
            response_text = await llm.generate_with_context(
                prompt=chat.message,
                context=context,
                temperature=0.7
            )

        async def event_generator():
            chunk_size = 160
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i : i + chunk_size]
                yield f"data: {chunk}\n\n"
                await asyncio.sleep(0)
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[stream] Chat endpoint error: {repr(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your chat request."
        )