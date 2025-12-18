from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.v1.dependencies import get_current_user_id
from app.services.personalization.spaced_repetition import SpacedRepetitionService
from app.services.personal_tutor import add_spaced_repetition_memory
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


class FlashcardReview(BaseModel):
    flashcard_id: str
    quality: int  # 0-5 rating


@router.post("/review")
async def review_flashcard(
    review: FlashcardReview,
    user_id: str = Depends(get_current_user_id)
):
    """Submit flashcard review for spaced repetition."""
    try:
        if not 0 <= review.quality <= 5:
            raise HTTPException(status_code=400, detail="Quality must be between 0 and 5")
        
        sr_service = SpacedRepetitionService()
        result = await sr_service.update_card_performance(
            user_id=user_id,
            flashcard_id=review.flashcard_id,
            quality=review.quality
        )

        # Push spaced-repetition feedback into Mem0 for personalization
        try:
            add_spaced_repetition_memory(
                user_id=user_id,
                flashcard_id=review.flashcard_id,
                quality=review.quality,
                ease_factor=result.get('ease_factor'),
                interval=result.get('interval'),
            )
        except Exception as mem_err:
            logger.warning(f"Spaced repetition memory add failed: {mem_err}")

        return result
        
    except Exception as e:
        logger.error(f"Review flashcard error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/due/{lesson_id}")
async def get_due_flashcards(
    lesson_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get flashcards due for review."""
    try:
        sr_service = SpacedRepetitionService()
        due_cards = await sr_service.get_due_cards(user_id, lesson_id)
        return due_cards
    except Exception as e:
        logger.error(f"Get due flashcards error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))