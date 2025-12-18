from typing import Dict, Any, Optional
from datetime import datetime  # <-- Import at the top
from app.database.supabase_client import supabase, supabase_admin # Import admin client just in case
from app.core.logging import get_logger

logger = get_logger(__name__)


class UserRepository:
    """Repository for user data access."""

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        try:
            # Use .single() to fetch one row or None
            result = supabase.table('users').select('*').eq('id', user_id).single().execute()
            return result.data  # Will be the dict if found, or None if not
        except Exception as e:
            # Use repr(e) for better logging
            logger.error(f"Get user by ID error for {user_id}: {repr(e)}", exc_info=True)
            raise

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email."""
        try:
            result = supabase.table('users').select('*').eq('email', email).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Get user by email error for {email}: {repr(e)}", exc_info=True)
            raise

    async def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username."""
        try:
            result = supabase.table('users').select('*').eq('username', username).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Get user by username error for {username}: {repr(e)}", exc_info=True)
            raise

    async def update(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile."""
        try:
            data['updated_at'] = datetime.utcnow().isoformat()
            # Use .single() to return the updated record directly
            result = supabase.table('users').update(data).eq('id', user_id).single().execute()
            
            if not result.data:
                logger.error(f"Failed to update user {user_id}, user not found or no data returned.")
                raise Exception("User update failed or user not found.")
                
            return result.data
        except Exception as e:
            logger.error(f"Update user error for {user_id}: {repr(e)}", exc_info=True)
            raise