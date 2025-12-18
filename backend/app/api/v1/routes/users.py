from fastapi import APIRouter, Depends, HTTPException, status # Import status
from app.schemas.auth import UserResponse
from app.repositories.user_repository import UserRepository
from app.core.logging import get_logger
from app.api.v1.dependencies import get_current_user_id

router = APIRouter()
logger = get_logger(__name__)


@router.get("/profile", response_model=UserResponse)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """Get the profile for the currently authenticated user."""
    try:
        user_repo = UserRepository()
        user = await user_repo.get_by_id(user_id)

        # --- CRITICAL FIX ---
        # Add a check to ensure the user profile was found
        if not user:
            logger.warning(f"User profile not found in 'users' table for authenticated user ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found."
            )
        # --------------------
            
        return user
    
    except HTTPException:
        # Re-raise the 404 HTTPException if it was thrown above
        raise
    except Exception as e:
        # Use repr(e) for safer logging and provide a generic error message
        logger.error(f"Get profile error for user {user_id}: {repr(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="An error occurred while fetching the user profile."
        )