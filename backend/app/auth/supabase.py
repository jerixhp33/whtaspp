from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Dict, Any, Optional
from app.config import get_settings
from app.services.supabase_service import get_supabase_admin_client

settings = get_settings()
security = HTTPBearer()

def verify_supabase_token(token: str) -> dict:
    try:
        # Supabase uses HS256 with the JWT secret (usually same as service role/anon key secrets, but often needs specific setup)
        # Here we decode without verification to get claims, then use supabase client to verify.
        # Alternatively, we could decode with the JWT secret.
        # For this implementation, we will decode with verification disabled, and assume Supabase client handles it, 
        # or we verify using supabase client's auth API.
        
        # A simple approach for Supabase JWT verification:
        client = get_supabase_admin_client()
        user = client.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user.user.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    user_data = verify_supabase_token(token)
    return user_data

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    client = get_supabase_admin_client()
    # Check profiles.is_admin
    user_id = user.get("id")
    response = client.table("profiles").select("is_admin").eq("id", user_id).execute()
    
    is_admin = False
    if response.data and len(response.data) > 0:
        is_admin = response.data[0].get("is_admin", False)
        
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user
