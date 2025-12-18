from typing import List, Tuple
import asyncio

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.v1.dependencies import get_current_user_id
from app.services.personal_tutor import (
    personalized_tutor_chat,
    get_student_learning_profile,
)


router = APIRouter()


class TutorChatRequest(BaseModel):
    message: str
    history: List[Tuple[str, str]] | None = None


class TutorChatResponse(BaseModel):
    history: List[Tuple[str, str]]
    reply: str


class TutorStreamRequest(BaseModel):
    message: str
    history: List[Tuple[str, str]] | None = None


@router.post("/chat", response_model=TutorChatResponse)
async def tutor_chat(
    payload: TutorChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Chat with the personalized AI tutor backed by Mem0 + Gemini.
    Uses the authenticated user_id as the student identifier.
    """
    history, _ = await personalized_tutor_chat(
        message=payload.message,
        student_id=user_id,
        history=payload.history or [],
    )

    # The last tuple in history contains the latest response
    last_reply = history[-1][1] if history else ""

    return TutorChatResponse(history=history, reply=last_reply)


@router.post("/chat/stream")
async def tutor_chat_stream(
    payload: TutorStreamRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Stream tutor response as SSE (chunked). We still generate the full reply,
    then send it in chunks to improve perceived responsiveness.
    """
    history, _ = await personalized_tutor_chat(
        message=payload.message,
        student_id=user_id,
        history=payload.history or [],
    )
    last_reply = history[-1][1] if history else ""

    async def event_generator():
        chunk_size = 160
        for i in range(0, len(last_reply), chunk_size):
            chunk = last_reply[i : i + chunk_size]
            yield f"data: {chunk}\n\n"
            await asyncio.sleep(0)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


class TutorProfileResponse(BaseModel):
    profile: str


@router.get("/profile", response_model=TutorProfileResponse)
async def tutor_profile(
    user_id: str = Depends(get_current_user_id),
):
    """
    Get the student's learning profile built from Mem0 memories.
    """
    profile_text = get_student_learning_profile(user_id)
    return TutorProfileResponse(profile=profile_text)

