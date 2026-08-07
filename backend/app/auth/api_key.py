from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Tuple, Dict, Any, Callable
from app.security.api_keys import generate_secure_key
from app.services.supabase_service import get_supabase_admin_client
from datetime import datetime, timezone
import hashlib
import logging

security = HTTPBearer()

def generate_api_key() -> Tuple[str, str]:
    full_key = generate_secure_key()
    key_hash = hash_api_key(full_key)
    return full_key, key_hash

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()

def verify_api_key(key: str, key_hash: str) -> bool:
    return hash_api_key(key) == key_hash

def get_key_prefix(key: str) -> str:
    return key[:12]

async def validate_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    if not token.startswith("app_live_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format",
        )
    
    prefix = get_key_prefix(token)
    client = get_supabase_admin_client()
    
    response = client.table("api_keys").select("*").eq("key_prefix", prefix).execute()
    if not response.data or len(response.data) == 0:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
        
    key_data = response.data[0]
    
    if key_data.get("status") != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key is not active")
        
    if key_data.get("expires_at"):
        expires_at = datetime.fromisoformat(key_data["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key has expired")
            
    key_hash = key_data.get("key_hash")
    if key_hash and not verify_api_key(token, key_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
        
    try:
        client.table("api_keys").update({
            "last_used_at": datetime.now(timezone.utc).isoformat(),
            "request_count": key_data.get("request_count", 0) + 1
        }).eq("id", key_data["id"]).execute()
    except Exception:
        pass
    
    return key_data

def check_permission(required: str) -> Callable:
    async def permission_dependency(key_data: dict = Depends(validate_api_key)) -> dict:
        permissions = key_data.get("permissions", [])
        if required not in permissions and "*" not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {required}"
            )
        return key_data
    return permission_dependency
