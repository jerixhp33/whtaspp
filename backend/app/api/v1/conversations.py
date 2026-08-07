from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from app.schemas.conversations import ConversationResponse, ConversationListResponse, CreateGroupRequest
from app.auth.api_key import check_permission

router = APIRouter()

@router.get("", dependencies=[Depends(check_permission("conversations:read"))])
async def list_conversations():
    return {"conversations": [], "total": 0}

@router.get("/{id}", dependencies=[Depends(check_permission("conversations:read"))])
async def get_conversation(id: UUID):
    return {"id": id, "type": "direct"}

@router.post("/groups", dependencies=[Depends(check_permission("conversations:write"))])
async def create_group(request: CreateGroupRequest):
    return {"id": "new-uuid", "type": "group"}

@router.put("/groups/{id}", dependencies=[Depends(check_permission("conversations:write"))])
async def update_group(id: UUID, request: CreateGroupRequest):
    return {"status": "success"}

@router.post("/{id}/members", dependencies=[Depends(check_permission("conversations:write"))])
async def add_member(id: UUID, user_id: UUID):
    return {"status": "success"}

@router.delete("/{id}/members/{user_id}", dependencies=[Depends(check_permission("conversations:write"))])
async def remove_member(id: UUID, user_id: UUID):
    return {"status": "success"}
