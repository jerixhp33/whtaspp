from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.notifications import NotificationCreateRequest
from app.auth.api_key import check_permission

router = APIRouter()

@router.post("", dependencies=[Depends(check_permission("notifications:send"))])
async def send_notification(request: NotificationCreateRequest):
    return {"status": "success"}
