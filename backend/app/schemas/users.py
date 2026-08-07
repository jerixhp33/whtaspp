from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserResponse(BaseModel):
    id: UUID
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    status: str = "offline"
    is_online: bool = False
    last_seen: Optional[datetime] = None

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int

class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None
