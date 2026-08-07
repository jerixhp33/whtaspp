from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID
from app.auth.supabase import require_admin
from app.schemas.admin import (
    DashboardStats, ApiKeyCreateRequest, ApiKeyResponse, ApiKeyCreateResponse,
    ApiKeyUpdateRequest, ApiKeyRotateResponse, ReportResponse, ReportUpdateRequest,
    AuditLogResponse, ApiUsageResponse
)
from app.auth.api_key import generate_api_key, get_key_prefix, hash_api_key
from app.services.supabase_service import get_supabase_admin_client
from datetime import datetime, timezone
import uuid
import logging

router = APIRouter()

def get_client():
    return get_supabase_admin_client()


@router.get("/dashboard", dependencies=[Depends(require_admin)])
async def get_dashboard_stats():
    client = get_client()
    try:
        users = client.table("profiles").select("id", count="exact").execute()
        active = client.table("profiles").select("id", count="exact").eq("is_online", True).execute()
        messages = client.table("messages").select("id", count="exact").execute()
        convos = client.table("conversations").select("id", count="exact").execute()
        groups = client.table("groups").select("id", count="exact").execute()
        calls = client.table("calls").select("id", count="exact").execute()
        reports = client.table("reports").select("id", count="exact").eq("status", "pending").execute()
        api_reqs = client.table("api_usage").select("id", count="exact").execute()

        return {
            "total_users": users.count or 0,
            "active_users": active.count or 0,
            "total_messages": messages.count or 0,
            "total_conversations": convos.count or 0,
            "total_groups": groups.count or 0,
            "total_calls": calls.count or 0,
            "pending_reports": reports.count or 0,
            "storage_usage": 0,
            "api_requests": api_reqs.count or 0,
        }
    except Exception as e:
        logging.error(f"Dashboard stats error: {e}")
        return DashboardStats(
            total_users=0, active_users=0, total_messages=0,
            total_conversations=0, total_groups=0, total_calls=0,
            pending_reports=0, storage_usage=0
        )


@router.get("/users", dependencies=[Depends(require_admin)])
async def list_users(
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    client = get_client()
    query = client.table("profiles").select("*")

    if q:
        query = query.or_(f"username.ilike.%{q}%,display_name.ilike.%{q}%,email.ilike.%{q}%")
    if status_filter == "disabled":
        query = query.eq("is_disabled", True)
    elif status_filter == "admin":
        query = query.eq("is_admin", True)
    elif status_filter == "active":
        query = query.eq("is_disabled", False)

    response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"users": response.data, "total": len(response.data)}


@router.put("/users/{user_id}", dependencies=[Depends(require_admin)])
async def update_user(user_id: UUID, is_disabled: Optional[bool] = None, is_admin: Optional[bool] = None):
    client = get_client()
    update_data = {}
    if is_disabled is not None:
        update_data["is_disabled"] = is_disabled
    if is_admin is not None:
        update_data["is_admin"] = is_admin

    if not update_data:
        raise HTTPException(status_code=400, detail="No update fields provided")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    response = client.table("profiles").update(update_data).eq("id", str(user_id)).execute()

    # Audit log
    action = "user_disabled" if is_disabled else "user_enabled" if is_disabled is False else "user_updated"
    try:
        client.rpc("create_audit_log", {
            "p_actor_id": None,
            "p_action": action,
            "p_resource_type": "user",
            "p_resource_id": str(user_id),
            "p_metadata": {}
        }).execute()
    except Exception:
        pass

    return {"status": "success", "data": response.data}


@router.get("/reports", dependencies=[Depends(require_admin)])
async def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    client = get_client()
    query = client.table("reports").select("*, reporter:profiles!reporter_id(*), reported_user:profiles!reported_user_id(*)")

    if status_filter:
        query = query.eq("status", status_filter)

    response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"reports": response.data, "total": len(response.data)}


@router.put("/reports/{report_id}", dependencies=[Depends(require_admin)])
async def update_report(report_id: UUID, request: ReportUpdateRequest):
    client = get_client()
    update_data = {
        "status": request.status,
        "resolution_note": request.resolution_note,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    response = client.table("reports").update(update_data).eq("id", str(report_id)).execute()

    try:
        client.rpc("create_audit_log", {
            "p_actor_id": None,
            "p_action": "report_reviewed",
            "p_resource_type": "report",
            "p_resource_id": str(report_id),
            "p_metadata": {"status": request.status}
        }).execute()
    except Exception:
        pass

    return {"status": "success", "data": response.data}


@router.get("/audit-logs", dependencies=[Depends(require_admin)])
async def list_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    client = get_client()
    query = client.table("audit_logs").select("*, actor:profiles!actor_id(id, username, display_name, avatar_url)")

    if action:
        query = query.eq("action", action)
    if resource_type:
        query = query.eq("resource_type", resource_type)

    response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"logs": response.data, "total": len(response.data)}


@router.post("/api-keys", dependencies=[Depends(require_admin)])
async def create_api_key_endpoint(request: ApiKeyCreateRequest):
    client = get_client()
    full_key, key_hash = generate_api_key()
    prefix = get_key_prefix(full_key)

    key_data = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "description": request.description or "",
        "key_prefix": prefix,
        "key_hash": key_hash,
        "permissions": request.permissions,
        "status": "active",
        "expires_at": request.expires_at.isoformat() if request.expires_at else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "request_count": 0,
    }

    # Note: created_by should be set from the authenticated admin user
    # For now we skip it since require_admin doesn't return the user object in this simplified version

    response = client.table("api_keys").insert(key_data).execute()

    try:
        client.rpc("create_audit_log", {
            "p_actor_id": None,
            "p_action": "api_key_created",
            "p_resource_type": "api_key",
            "p_resource_id": key_data["id"],
            "p_metadata": {"name": request.name, "permissions": request.permissions}
        }).execute()
    except Exception:
        pass

    result = dict(key_data)
    if response.data and isinstance(response.data, list) and len(response.data) > 0 and isinstance(response.data[0], dict):
        result.update({k: v for k, v in response.data[0].items() if v is not None})
    result["secret"] = full_key  # Show only once!
    return result


@router.get("/api-keys", dependencies=[Depends(require_admin)])
async def list_api_keys():
    client = get_client()
    response = client.table("api_keys").select("*").order("created_at", desc=True).execute()
    # Never return key_hash in response
    keys = []
    for key in response.data:
        key.pop("key_hash", None)
        keys.append(key)
    return {"keys": keys, "total": len(keys)}


@router.put("/api-keys/{key_id}", dependencies=[Depends(require_admin)])
async def update_api_key(key_id: UUID, request: ApiKeyUpdateRequest):
    client = get_client()
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if request.name is not None:
        update_data["name"] = request.name
    if request.description is not None:
        update_data["description"] = request.description
    if request.permissions is not None:
        update_data["permissions"] = request.permissions
    if request.status is not None:
        update_data["status"] = request.status

    response = client.table("api_keys").update(update_data).eq("id", str(key_id)).execute()
    return {"status": "success", "data": response.data}


@router.post("/api-keys/{key_id}/revoke", dependencies=[Depends(require_admin)])
async def revoke_api_key(key_id: UUID):
    client = get_client()
    response = client.table("api_keys").update({
        "status": "revoked",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", str(key_id)).execute()

    try:
        client.rpc("create_audit_log", {
            "p_actor_id": None,
            "p_action": "api_key_revoked",
            "p_resource_type": "api_key",
            "p_resource_id": str(key_id),
            "p_metadata": {}
        }).execute()
    except Exception:
        pass

    return {"status": "success"}


@router.post("/api-keys/{key_id}/rotate", dependencies=[Depends(require_admin)])
async def rotate_api_key(key_id: UUID):
    client = get_client()
    full_key, key_hash = generate_api_key()
    prefix = get_key_prefix(full_key)

    response = client.table("api_keys").update({
        "key_prefix": prefix,
        "key_hash": key_hash,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", str(key_id)).execute()

    try:
        client.rpc("create_audit_log", {
            "p_actor_id": None,
            "p_action": "api_key_rotated",
            "p_resource_type": "api_key",
            "p_resource_id": str(key_id),
            "p_metadata": {"new_prefix": prefix}
        }).execute()
    except Exception:
        pass

    return {"id": str(key_id), "new_key_prefix": prefix, "secret": full_key}


@router.post("/api-keys/{key_id}/disable", dependencies=[Depends(require_admin)])
async def disable_api_key(key_id: UUID):
    client = get_client()
    response = client.table("api_keys").update({
        "status": "disabled",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", str(key_id)).execute()

    try:
        client.rpc("create_audit_log", {
            "p_actor_id": None,
            "p_action": "api_key_disabled",
            "p_resource_type": "api_key",
            "p_resource_id": str(key_id),
            "p_metadata": {}
        }).execute()
    except Exception:
        pass

    return {"status": "success"}


@router.post("/api-keys/{key_id}/enable", dependencies=[Depends(require_admin)])
async def enable_api_key(key_id: UUID):
    client = get_client()
    response = client.table("api_keys").update({
        "status": "active",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", str(key_id)).execute()

    try:
        client.rpc("create_audit_log", {
            "p_actor_id": None,
            "p_action": "api_key_enabled",
            "p_resource_type": "api_key",
            "p_resource_id": str(key_id),
            "p_metadata": {}
        }).execute()
    except Exception:
        pass

    return {"status": "success"}


@router.get("/api-keys/{key_id}/usage", dependencies=[Depends(require_admin)])
async def get_api_key_usage(
    key_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    client = get_client()
    response = client.table("api_usage").select("*").eq(
        "api_key_id", str(key_id)
    ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    return {"usage": response.data, "total": len(response.data)}
