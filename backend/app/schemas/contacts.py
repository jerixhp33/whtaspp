from pydantic import BaseModel, Field
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

# Privacy-first Phone Contacts Matching Schemas
class PhoneMatchItem(BaseModel):
    id: str = Field(..., description="Device contact ID")
    name: str = Field(..., description="Device contact local display name")
    phone: str = Field(..., description="Normalized E.164 phone number")

class PhoneMatchRequest(BaseModel):
    contacts: List[PhoneMatchItem] = Field(..., max_length=1000, description="List of normalized device contacts to match")

class MatchedContactItem(BaseModel):
    device_contact_id: str
    device_name: str
    user_id: UUID
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    is_on_chatflow: bool = True

class PhoneMatchResponse(BaseModel):
    matches: List[MatchedContactItem]
    total_matches: int
