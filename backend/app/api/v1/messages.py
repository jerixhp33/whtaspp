from fastapi import APIRouter, Depends, Query, HTTPException, status
from uuid import UUID
from typing import Optional
from app.schemas.messages import MessageResponse, MessageListResponse, MessageCreateRequest, MessageUpdateRequest, MessageReactionRequest
from app.auth.api_key import check_permission

router = APIRouter()

@router.get("", dependencies=[Depends(check_permission("messages:read"))])
async def get_messages(
    conversation_id: UUID, 
    limit: int = Query(50, ge=1, le=100), 
    offset: int = Query(0, ge=0),
    search: Optional[str] = None
):
    return {"messages": [], "total": 0, "has_more": False}

@router.post("", dependencies=[Depends(check_permission("messages:send"))])
async def send_message(request: MessageCreateRequest):
    return {"status": "success"}

@router.put("/{id}", dependencies=[Depends(check_permission("messages:send"))])
async def edit_message(id: UUID, request: MessageUpdateRequest):
    return {"status": "success"}

@router.delete("/{id}", dependencies=[Depends(check_permission("messages:send"))])
async def delete_message(id: UUID):
    return {"status": "success"}

@router.post("/{id}/reactions", dependencies=[Depends(check_permission("messages:send"))])
async def react_to_message(id: UUID, request: MessageReactionRequest):
    return {"status": "success"}

@router.delete("/{id}/reactions/{emoji}", dependencies=[Depends(check_permission("messages:send"))])
async def remove_reaction(id: UUID, emoji: str):
    return {"status": "success"}
