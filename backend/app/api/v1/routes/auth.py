from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.auth import (
    SignupRequest, LoginRequest, OnboardingRequest,
    TokenResponse, UserResponse
)
from app.services.auth.authentication import AuthService
from app.core.logging import get_logger
from app.core.exceptions import AuthenticationError, ValidationError

# --- Use the centralized dependency for getting the current user ---
from app.api.v1.dependencies import get_current_user_id, get_current_user
# -----------------------------------------------------------------

router = APIRouter()
logger = get_logger(__name__)

# This dependency can be simplified as we'll inject the service directly
def get_auth_service() -> AuthService:
    """Dependency to get an instance of the authentication service."""
    return AuthService()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignupRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user and create their profile."""
    try:
        logger.info(f"Signup attempt for email: {request.email}")
        # The auth_service will raise exceptions on failure, which we catch below
        user_data = await auth_service.signup(
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            username=request.username
        )
        logger.info(f"User created successfully: {user_data.get('id', 'unknown')}")
        # Pydantic's response_model will automatically convert the dict to a UserResponse
        return user_data
    except ValidationError as e:
        # Catch specific validation errors from the service (e.g., "Username already exists")
        logger.warning(f"Validation error during signup for {request.email}: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Catch any other unexpected errors during signup
        logger.error(f"Unexpected signup error for {request.email}: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred during signup.")

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Authenticate a user and return access and refresh tokens."""
    try:
        logger.info(f"Login attempt for email: {request.email}")
        result = await auth_service.login(
            email=request.email,
            password=request.password
        )
        logger.info(f"Login successful for user: {result.get('user', {}).get('id', 'unknown')}")
        return result
    except AuthenticationError as e:
        logger.warning(f"Login failed for {request.email}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/onboarding", response_model=UserResponse)
async def complete_onboarding(
    request: OnboardingRequest,
    user_id: str = Depends(get_current_user_id), # Use the dependency to get user ID
    auth_service: AuthService = Depends(get_auth_service)
):
    """Complete the user's profile with roles and interests after initial signup."""
    try:
        logger.info(f"Onboarding for user: {user_id}")
        user = await auth_service.complete_onboarding(
            user_id=user_id,
            user_role=request.user_role.value, # Pass the string value of the enum
            role_type=request.role_type,
            interests=request.interests,
            grade_level=request.grade_level,
            subjects=request.subjects
        )
        logger.info(f"Onboarding completed for user: {user_id}")
        return user
    except ValidationError as e:
        logger.error(f"Validation error during onboarding for user {user_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected onboarding error for user {user_id}: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Onboarding failed due to an unexpected error.")

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    # This endpoint will use a refresh token, which we extract from the header
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Get a new access token using a valid refresh token."""
    try:
        refresh_token_str = credentials.credentials
        result = await auth_service.refresh_tokens(refresh_token_str)
        return result
    except AuthenticationError as e:
        logger.warning(f"Token refresh failed: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    user_id: str = Depends(get_current_user_id), # Verify token is valid before logout
    auth_service: AuthService = Depends(get_auth_service)
):
    """Log out the user (server-side action, client also clears tokens)."""
    # This is mostly for logging purposes or if you implement server-side session invalidation later
    await auth_service.logout(user_id)
    return # Return no content on success

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    user: dict = Depends(get_current_user) # Use dependency that gets the full user profile
):
    """Get the profile of the currently authenticated user."""
    # The dependency already fetched the user, so we just return it
    return user