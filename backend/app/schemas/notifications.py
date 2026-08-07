from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class NotificationCreateRequest(BaseModel):
    user_id: UUID
    type: str
    title: str
    body: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    is_read: bool = False
    created_at: datetime
