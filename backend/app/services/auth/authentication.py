from typing import Dict, Any, Optional
from datetime import datetime
# Ensure both clients are imported
from app.database.supabase_client import supabase, supabase_admin
from app.core.exceptions import AuthenticationError, ValidationError
from app.core.logging import get_logger

logger = get_logger(__name__)


class AuthService:
    """Authentication service."""

    async def signup(
        self,
        email: str,
        password: str,
        full_name: str,
        username: str
    ) -> Dict[str, Any]:
        """Register a new user."""
        auth_user_id = None
        try:
            existing_user_res = supabase.table("users").select("id").eq("username", username).execute()
            if existing_user_res.data:
                raise ValidationError("Username already exists")

            auth_response = supabase.auth.sign_up({
                "email": email,
                "password": password
            })

            if hasattr(auth_response, 'error') and auth_response.error:
                error_message = auth_response.error.message if hasattr(auth_response.error, 'message') else str(auth_response.error)
                logger.error(f"Supabase auth sign_up error: {error_message}")
                if "User already registered" in error_message:
                    raise ValidationError("User with this email already exists.")
                if "Password should be at least 6 characters" in error_message:
                    raise ValidationError("Password is too short (minimum 6 characters required by Supabase).")
                raise ValidationError(f"Authentication service error: {error_message}")

            if not auth_response.user:
                logger.error("Supabase auth sign_up succeeded but returned no user object.")
                raise ValidationError("Failed to create user - unexpected response from auth service.")

            auth_user_id = auth_response.user.id
            logger.info(f"Supabase auth user created successfully: {auth_user_id}")

            user_profile_data = {
                "id": auth_user_id,
                "email": email,
                "full_name": full_name,
                "username": username,
                "is_onboarded": False
            }

            logger.info(f"Attempting to insert profile into 'users' table for ID: {auth_user_id}")
            profile_res = supabase_admin.table("users").insert(user_profile_data).execute()

            if hasattr(profile_res, 'error') and profile_res.error:
                profile_error_message = profile_res.error.message if hasattr(profile_res.error, 'message') else str(profile_res.error)
                logger.error(f"Failed to create profile in 'users' table: {profile_error_message}")
                try:
                    supabase_admin.auth.admin.delete_user(auth_user_id)
                    logger.info(f"Cleaned up orphaned auth user: {auth_user_id}")
                except Exception as cleanup_error:
                    logger.error(f"Failed to clean up orphaned auth user {auth_user_id}: {cleanup_error}")
                raise ValidationError(f"Failed to save user profile: {profile_error_message}")

            if not profile_res.data:
                   logger.error(f"Profile insert into 'users' table succeeded but returned no data for ID: {auth_user_id}")
                   raise ValidationError("Failed to create user profile - unexpected database response.")

            logger.info(f"User profile created successfully for {auth_user_id}")
            return profile_res.data[0]

        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during signup for {email}: {repr(e)}", exc_info=True)
            if auth_user_id:
                 try:
                      supabase_admin.auth.admin.delete_user(auth_user_id)
                      logger.info(f"Cleaned up orphaned auth user due to unexpected error: {auth_user_id}")
                 except Exception as cleanup_error:
                      logger.error(f"Failed to clean up orphaned auth user {auth_user_id} after error: {cleanup_error}")
            raise Exception("An unexpected error occurred during signup.")

    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return tokens."""
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if hasattr(auth_response, 'error') and auth_response.error:
                error_message = auth_response.error.message if hasattr(auth_response.error, 'message') else str(auth_response.error)
                raise AuthenticationError(f"Login failed: {error_message}")

            if not auth_response.user or not auth_response.session:
                raise AuthenticationError("Invalid credentials")

            user_result = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()

            if not user_result.data:
                raise AuthenticationError("User profile not found")

            return {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "token_type": "bearer",
                "expires_in": 3600,
                "user": user_result.data[0]
            }

        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(f"Login error: {str(e)}", exc_info=True)
            raise AuthenticationError("Invalid credentials")

    async def verify_token(self, token: str) -> str:
        """Verify JWT token and return user ID."""
        try:
            user_response = supabase.auth.get_user(token)

            if hasattr(user_response, 'error') and user_response.error:
                raise AuthenticationError("Invalid token")

            if not user_response.user:
                raise AuthenticationError("Invalid token")

            return user_response.user.id

        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            raise AuthenticationError("Invalid token")

    # --- THIS IS THE METHOD THAT WAS MISSING OR INCORRECT ---
    async def complete_onboarding(
        self, user_id: str, user_role: str, role_type: str, interests: list,
        grade_level: Optional[str], subjects: list
    ) -> Dict[str, Any]:
        """Complete user onboarding."""
        try:
            update_data = {
                "user_role": user_role,
                "role_type": role_type,
                "interests": interests,
                "grade_level": grade_level,
                "subjects": subjects,
                "is_onboarded": True
            }
            logger.info(f"Attempting to update user {user_id} with data: {update_data}")
            
            # Use supabase_admin to bypass RLS and remove .single()
            result = supabase_admin.table("users").update(update_data).eq("id", user_id).execute()

            if not result.data:
                raise ValidationError("Failed to update user profile")

            return result.data[0]

        except Exception as e:
            logger.error(f"Onboarding error: {repr(e)}", exc_info=True)
            raise ValidationError(f"Onboarding failed: {str(e)}")
    # -----------------------------------------------------

    async def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token."""
        try:
            response = supabase.auth.refresh_session(refresh_token)

            if hasattr(response, 'error') and response.error:
                raise AuthenticationError("Invalid refresh token")

            if not response.session:
                raise AuthenticationError("Invalid refresh token")

            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "token_type": "bearer",
                "expires_in": 3600
            }

        except Exception as e:
            logger.error(f"Refresh token error: {str(e)}")
            raise AuthenticationError("Invalid refresh token")

    async def logout(self, user_id: str):
        """Logout user."""
        try:
            logger.info(f"Logout initiated for user: {user_id}")
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")

    async def get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        """Get user by ID using the admin client to bypass RLS."""
        try:
            result = supabase_admin.table("users").select("*").eq("id", user_id).single().execute()

            if not result.data:
                raise ValidationError("User not found")

            return result.data
        except Exception as e:
            logger.error(f"Get user by ID error for {user_id}: {repr(e)}", exc_info=True)
            raise ValidationError(f"Failed to get user: {str(e)}")