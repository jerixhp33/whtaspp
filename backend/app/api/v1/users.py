from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional
from app.schemas.users import UserListResponse, UserResponse
from app.auth.api_key import check_permission
from app.services.supabase_service import get_supabase_client
from uuid import UUID

router = APIRouter()

@router.get("", response_model=UserListResponse, dependencies=[Depends(check_permission("users:read"))])
async def list_users(
    q: Optional[str] = None, 
    limit: int = Query(20, ge=1, le=100), 
    offset: int = Query(0, ge=0)
):
    client = get_supabase_client()
    query = client.table("profiles").select("*", count="exact")
    
    if q:
        query = query.ilike("username", f"%{q}%")
        
    response = query.range(offset, offset + limit - 1).execute()
    
    return UserListResponse(
        users=response.data,
        total=response.count if response.count is not None else 0
    )

@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(check_permission("users:read"))])
async def get_user(user_id: UUID):
    client = get_supabase_client()
    response = client.table("profiles").select("*").eq("id", str(user_id)).execute()
    
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    return response.data[0]
