from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from uuid import UUID

class CallCreateRequest(BaseModel):
    conversation_id: UUID
    call_type: Literal['voice', 'video']

class CallResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    caller_id: UUID
    call_type: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None
    participants: List[Any]
    created_at: datetime

class CallUpdateRequest(BaseModel):
    status: str

class SignalingMessage(BaseModel):
    type: Literal['offer', 'answer', 'ice-candidate', 'call-start', 'call-accept', 'call-reject', 'call-end']
    call_id: UUID
    sender_id: UUID
    recipient_id: UUID
    data: Dict[str, Any]
