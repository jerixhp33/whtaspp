from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

class ConversationResponse(BaseModel):
    id: UUID
    type: str
    last_message: Optional[Any] = None
    last_message_at: Optional[datetime] = None
    members: List[Any]
    unread_count: int = 0
    created_at: datetime

class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int

class CreateGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    member_ids: List[UUID]
