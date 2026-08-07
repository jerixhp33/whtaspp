from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from app.schemas.users import UserResponse

class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: Optional[str] = None
    message_type: str
    reply_to_id: Optional[UUID] = None
    forwarded_from_id: Optional[UUID] = None
    is_edited: bool = False
    is_deleted: bool = False
    attachments: Optional[List[Any]] = None
    reactions: Optional[List[Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    sender: UserResponse

class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    has_more: bool

class MessageCreateRequest(BaseModel):
    conversation_id: UUID
    content: Optional[str] = None
    message_type: str = 'text'
    reply_to_id: Optional[UUID] = None
    metadata: Optional[Dict[str, Any]] = None

class MessageUpdateRequest(BaseModel):
    content: str

class MessageReactionRequest(BaseModel):
    emoji: str
