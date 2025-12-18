from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.services.auth.authentication import AuthService
from app.core.logging import get_logger

security = HTTPBearer()
logger = get_logger(__name__)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Dependency to get current user ID from JWT token."""
    try:
        auth_service = AuthService()
        user_id = await auth_service.verify_token(credentials.credentials)
        return user_id
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    user_id: str = Depends(get_current_user_id)
) -> dict:
    """Dependency to get current user object."""
    try:
        auth_service = AuthService()
        user = await auth_service.get_user_by_id(user_id)
        return user
    except Exception as e:
        logger.error(f"Get user failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )