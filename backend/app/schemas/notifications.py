from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class NotificationCreateRequest(BaseModel):
    user_id: UUID
    actor_id: Optional[UUID] = None
    type: str
    conversation_id: Optional[UUID] = None
    message_id: Optional[UUID] = None
    title: str
    body: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    actor_id: Optional[UUID] = None
    type: str
    conversation_id: Optional[UUID] = None
    message_id: Optional[UUID] = None
    title: str
    body: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    unread_count: int
    total: int

class MarkReadRequest(BaseModel):
    notification_id: Optional[UUID] = None
    notification_ids: Optional[List[UUID]] = None
    mark_all: bool = False

class DeviceRegisterRequest(BaseModel):
    platform: str = Field(..., description="web | android | ios")
    device_id: str
    push_token: Optional[str] = None
    endpoint: Optional[str] = None
    public_key: Optional[str] = None
    auth_key: Optional[str] = None

class DeviceResponse(BaseModel):
    id: UUID
    user_id: UUID
    platform: str
    device_id: str
    is_active: bool
    last_seen_at: datetime
    created_at: datetime

class PushTestRequest(BaseModel):
    title: str = "ChatFlow Test Notification"
    body: str = "Real-time push notifications are fully working!"
    type: str = "system"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
