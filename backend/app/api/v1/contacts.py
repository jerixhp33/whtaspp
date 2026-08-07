from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
import re
from app.schemas.contacts import (
    ContactResponse, ContactListResponse, ContactCreateRequest,
    ContactRequestCreate, ContactRequestResponse, BlockUserRequest,
    PhoneMatchRequest, PhoneMatchResponse, MatchedContactItem
)
from app.services.supabase_service import get_supabase_admin_client

router = APIRouter()

@router.get("", dependencies=[])
async def list_contacts():
    return {"contacts": [], "total": 0}

@router.post("")
async def add_contact(request: ContactCreateRequest):
    return {"status": "success"}

@router.delete("/{contact_id}")
async def remove_contact(contact_id: UUID):
    return {"status": "success"}

@router.post("/requests")
async def send_contact_request(request: ContactRequestCreate):
    return {"status": "success"}

@router.get("/requests")
async def list_pending_requests():
    return []

@router.put("/requests/{id}/accept")
async def accept_request(id: UUID):
    return {"status": "success"}

@router.put("/requests/{id}/reject")
async def reject_request(id: UUID):
    return {"status": "success"}

@router.post("/block")
async def block_user(request: BlockUserRequest):
    return {"status": "success"}

@router.delete("/block/{user_id}")
async def unblock_user(user_id: UUID):
    return {"status": "success"}

# Privacy-preserving phone contacts matching endpoint
@router.post("/match", response_model=PhoneMatchResponse)
async def match_phone_contacts(request: PhoneMatchRequest):
    if not request.contacts:
        return PhoneMatchResponse(matches=[], total_matches=0)

    # Normalize input numbers to E.164 (+ digits)
    phone_map = {}
    normalized_list = []
    for item in request.contacts[:500]: # max 500 per batch
        raw = item.phone.strip()
        num = re.sub(r'[^0-9+]', '', raw)
        if len(num) >= 7:
            if not num.startswith('+'):
                num = '+' + num
            phone_map[num] = item
            normalized_list.append(num)

    if not normalized_list:
        return PhoneMatchResponse(matches=[], total_matches=0)

    try:
        supabase = get_supabase_admin_client()
        # Query discoverable profiles matching normalized numbers
        res = supabase.table('profiles') \
            .select('id, username, display_name, avatar_url, phone_number_normalized') \
            .eq('phone_discoverable', True) \
            .in_('phone_number_normalized', normalized_list) \
            .execute()

        matches = []
        if res.data:
            for profile in res.data:
                norm_phone = profile.get('phone_number_normalized')
                device_item = phone_map.get(norm_phone)
                if device_item:
                    matches.append(
                        MatchedContactItem(
                            device_contact_id=device_item.id,
                            device_name=device_item.name,
                            user_id=UUID(profile['id']),
                            username=profile.get('username') or '',
                            display_name=profile.get('display_name') or profile.get('username') or device_item.name,
                            avatar_url=profile.get('avatar_url'),
                            is_on_chatflow=True
                        )
                    )

        return PhoneMatchResponse(matches=matches, total_matches=len(matches))

    except Exception as err:
        print("Error matching phone contacts:", err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to match phone contacts"
        )
