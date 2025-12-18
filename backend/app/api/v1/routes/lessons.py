from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional

# --- THIS IS THE FIX ---
# Import the new LessonMetadataResponse schema
from app.schemas.lesson import LessonResponse, LessonMetadataResponse
# --- END FIX ---

from app.repositories.lesson_repository import LessonRepository
from app.core.logging import get_logger
from app.api.v1.dependencies import get_current_user_id

router = APIRouter()
logger = get_logger(__name__)


# --- THIS IS THE FIX ---
# Change the response_model to List[LessonMetadataResponse]
@router.get("/", response_model=List[LessonMetadataResponse])
# --- END FIX ---
async def get_lessons(
    user_id: str = Depends(get_current_user_id),
    folder_id: Optional[str] = Query(None, description="Optional folder ID to filter lessons"),
    skip: int = Query(0, ge=0, description="Number of lessons to skip for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of lessons to return")
):
    """Get all lessons (metadata) for the current user, optionally filtered by folder."""
    try:
        lesson_repo = LessonRepository()
        lessons = await lesson_repo.get_user_lessons(
            user_id=user_id,
            folder_id=folder_id,
            skip=skip,
            limit=limit
        )
        # Now, the 'lessons' (which lack heavy fields) will correctly validate
        # against the LessonMetadataResponse schema.
        return lessons
    except Exception as e:
        logger.error(f"Get lessons error: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve lessons.")


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific lesson by ID, including all its content (questions, flashcards, notes)."""
    try:
        lesson_repo = LessonRepository()
        lesson = await lesson_repo.get_lesson_by_id(lesson_id, user_id)
        if not lesson:
            logger.warning(f"Lesson not found or access denied for ID: {lesson_id}, User: {user_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found or access denied")
        # This endpoint still uses LessonResponse, which is correct because
        # get_lesson_by_id is expected to load all the data.
        return lesson
    except HTTPException:
        raise # Re-raise 404 if found above
    except Exception as e:
        logger.error(f"Get lesson error for ID {lesson_id}: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve lesson details.")


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a specific lesson and all its associated content."""
    try:
        lesson_repo = LessonRepository()
        deleted = await lesson_repo.delete_lesson(lesson_id, user_id)
        if not deleted:
            logger.warning(f"Attempted to delete non-existent or unauthorized lesson ID: {lesson_id}, User: {user_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found or access denied")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete lesson error for ID {lesson_id}: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete lesson.")
