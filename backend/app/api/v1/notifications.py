from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.supabase import get_current_user
from app.auth.api_key import check_permission
from app.schemas.notifications import (
    NotificationCreateRequest,
    NotificationResponse,
    NotificationListResponse,
    MarkReadRequest,
    DeviceRegisterRequest,
    DeviceResponse,
    PushTestRequest
)
from app.services.supabase_service import get_supabase_client, get_supabase_admin_client
from app.services.push_service import push_service

router = APIRouter()


def _uid(current_user: dict) -> str:
    return str(current_user.get("id", ""))


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get paginated notifications for the authenticated user with real unread count.
    """
    try:
        supabase = get_supabase_admin_client()
        uid = _uid(current_user)

        # Build query
        query = supabase.from_("notifications") \
            .select("*", count="exact") \
            .eq("user_id", uid) \
            .order("created_at", desc=True)

        if unread_only:
            query = query.eq("is_read", False)

        res = query.range(offset, offset + limit - 1).execute()

        # Get total unread count for user
        unread_res = supabase.from_("notifications") \
            .select("id", count="exact") \
            .eq("user_id", uid) \
            .eq("is_read", False) \
            .execute()

        unread_count = unread_res.count or 0
        items = res.data or []
        total = res.count or len(items)

        return NotificationListResponse(
            items=items,
            unread_count=unread_count,
            total=total
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notifications: {str(e)}"
        )


@router.post("/mark-read")
async def mark_notifications_read(
    payload: MarkReadRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a single notification, a list of IDs, or all notifications as read.
    """
    try:
        supabase = get_supabase_admin_client()
        uid = _uid(current_user)
        now_iso = datetime.now(timezone.utc).isoformat()

        if payload.mark_all:
            supabase.from_("notifications") \
                .update({"is_read": True, "read_at": now_iso}) \
                .eq("user_id", uid) \
                .eq("is_read", False) \
                .execute()
        elif payload.notification_ids:
            ids_str = [str(i) for i in payload.notification_ids]
            supabase.from_("notifications") \
                .update({"is_read": True, "read_at": now_iso}) \
                .eq("user_id", uid) \
                .in_("id", ids_str) \
                .execute()
        elif payload.notification_id:
            supabase.from_("notifications") \
                .update({"is_read": True, "read_at": now_iso}) \
                .eq("user_id", uid) \
                .eq("id", str(payload.notification_id)) \
                .execute()

        return {"status": "success", "message": "Notifications marked as read"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notifications read: {str(e)}"
        )


@router.delete("/clear")
async def clear_notifications(
    read_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Clear notifications for the authenticated user.
    """
    try:
        supabase = get_supabase_admin_client()
        uid = _uid(current_user)
        query = supabase.from_("notifications").delete().eq("user_id", uid)

        if read_only:
            query = query.eq("is_read", True)

        query.execute()
        return {"status": "success", "message": "Notification history cleared"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear notifications: {str(e)}"
        )


@router.post("/devices")
async def register_device(
    payload: DeviceRegisterRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Register or refresh a Web Push or Android device push token.
    """
    try:
        supabase = get_supabase_admin_client()
        uid = _uid(current_user)
        now_iso = datetime.now(timezone.utc).isoformat()

        data = {
            "user_id": uid,
            "platform": payload.platform,
            "device_id": payload.device_id,
            "push_token": payload.push_token,
            "endpoint": payload.endpoint,
            "public_key": payload.public_key,
            "auth_key": payload.auth_key,
            "is_active": True,
            "last_seen_at": now_iso,
            "updated_at": now_iso,
        }

        # Upsert by user_id + platform + device_id
        res = supabase.from_("notification_devices") \
            .upsert(data, on_conflict="user_id,platform,device_id") \
            .execute()

        return {"status": "success", "message": "Device registered for push notifications"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register device: {str(e)}"
        )


@router.delete("/devices/{device_id}")
async def unregister_device(
    device_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Unregister / deactivate a device push token on logout.
    """
    try:
        supabase = get_supabase_admin_client()
        uid = _uid(current_user)
        supabase.from_("notification_devices") \
            .delete() \
            .eq("user_id", uid) \
            .eq("device_id", device_id) \
            .execute()

        return {"status": "success", "message": "Device unregistered"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unregister device: {str(e)}"
        )


@router.post("/push-test")
async def push_test(
    payload: PushTestRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a test push notification to all active devices of the authenticated user.
    """
    uid = _uid(current_user)
    res = await push_service.send_push_to_user(
        user_id=uid,
        title=payload.title,
        body=payload.body,
        notification_type=payload.type,
        metadata=payload.metadata
    )
    return res


@router.post("", dependencies=[Depends(check_permission("notifications:send"))])
async def send_notification(request: NotificationCreateRequest):
    """
    API key authorized endpoint to create a notification and trigger push delivery.
    """
    try:
        supabase = get_supabase_admin_client()
        data = {
            "user_id": str(request.user_id),
            "actor_id": str(request.actor_id) if request.actor_id else None,
            "type": request.type,
            "conversation_id": str(request.conversation_id) if request.conversation_id else None,
            "message_id": str(request.message_id) if request.message_id else None,
            "title": request.title,
            "body": request.body,
            "metadata": request.metadata or {},
            "data": request.data or {},
            "is_read": False,
        }

        res = supabase.from_("notifications").insert(data).execute()

        # Trigger background push notification
        await push_service.send_push_to_user(
            user_id=request.user_id,
            title=request.title,
            body=request.body or "",
            notification_type=request.type,
            metadata=request.metadata
        )

        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create notification: {str(e)}"
        )
