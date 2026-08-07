from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_messages: int
    total_conversations: int
    total_groups: int
    total_calls: int
    pending_reports: int
    storage_usage: int

class ApiKeyCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str]
    expires_at: Optional[datetime] = None

class ApiKeyResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    key_prefix: str
    permissions: List[str]
    status: str
    expires_at: Optional[datetime] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    last_used_at: Optional[datetime] = None
    request_count: int = 0

class ApiKeyCreateResponse(ApiKeyResponse):
    secret: str

class ApiKeyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    status: Optional[str] = None

class ApiKeyRotateResponse(BaseModel):
    id: UUID
    new_key_prefix: str
    secret: str

class ReportResponse(BaseModel):
    id: UUID
    reporter_id: UUID
    reported_user_id: UUID
    reason: str
    description: str
    status: str
    reviewed_by: Optional[UUID] = None
    resolution_note: Optional[str] = None
    created_at: datetime

class ReportUpdateRequest(BaseModel):
    status: str
    resolution_note: str

class AuditLogResponse(BaseModel):
    id: UUID
    actor_id: UUID
    action: str
    resource_type: str
    resource_id: str
    metadata: Optional[Any] = None
    created_at: datetime

class ApiUsageResponse(BaseModel):
    id: UUID
    api_key_id: UUID
    endpoint: str
    method: str
    status_code: int
    response_time_ms: int
    created_at: datetime
