from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.users import UserResponse

class ContactResponse(BaseModel):
    id: UUID
    user_id: UUID
    contact_id: UUID
    nickname: Optional[str] = None
    contact: UserResponse
    created_at: datetime

class ContactListResponse(BaseModel):
    contacts: List[ContactResponse]
    total: int

class ContactCreateRequest(BaseModel):
    contact_id: UUID
    nickname: Optional[str] = None

class ContactRequestCreate(BaseModel):
    to_user_id: UUID
    message: Optional[str] = None

class ContactRequestResponse(BaseModel):
    id: UUID
    from_user_id: UUID
    to_user_id: UUID
    status: str
    message: Optional[str] = None
    from_user: UserResponse
    to_user: UserResponse
    created_at: datetime

class BlockUserRequest(BaseModel):
    blocked_user_id: UUID
    reason: Optional[str] = None
