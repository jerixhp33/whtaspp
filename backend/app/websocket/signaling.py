from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, Any, Optional
import json
import logging
from app.auth.supabase import verify_supabase_token
from app.schemas.calls import SignalingMessage

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@router.websocket("/signaling")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    user_id = None
    try:
        if token:
            user_data = verify_supabase_token(token)
            user_id = user_data.get("id")
            await manager.connect(websocket, user_id)
        else:
            # Wait for first message to be auth if token not in query
            await websocket.accept()
            auth_msg = await websocket.receive_text()
            data = json.loads(auth_msg)
            if "token" in data:
                user_data = verify_supabase_token(data["token"])
                user_id = user_data.get("id")
                manager.active_connections[user_id] = websocket
            else:
                await websocket.close(code=1008, reason="Unauthorized")
                return

        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            msg = SignalingMessage(**data)
            
            # Forward the message to the recipient
            if str(msg.recipient_id) in manager.active_connections:
                await manager.send_personal_message(
                    data_str, 
                    str(msg.recipient_id)
                )
            else:
                # Store missed call / notification logic here
                pass
                
    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(user_id)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        if user_id:
            manager.disconnect(user_id)
