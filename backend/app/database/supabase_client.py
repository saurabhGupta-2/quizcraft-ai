from supabase import create_client, Client
from app.core.config import settings
from functools import lru_cache


@lru_cache()
def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )


@lru_cache()
def get_supabase_admin_client() -> Client:
    """Get Supabase admin client with service role key."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )


supabase = get_supabase_client()
supabase_admin = get_supabase_admin_client()