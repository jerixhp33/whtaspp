from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

def get_supabase_client() -> Client:
    # We use the service role key for backend operations
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    if not url or not key:
        raise ValueError("Supabase URL and Service Role Key must be set")
    return create_client(url, key)

def get_supabase_admin_client() -> Client:
    # For operations requiring elevated privileges
    return get_supabase_client()
