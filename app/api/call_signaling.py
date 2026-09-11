"""
MindBridge AI — Real-Time WebRTC Call Signaling WebSocket API
Secured with temporary appointment-verified call tokens.
Protects student privacy by guaranteeing only anonymous aliases are transmitted.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, List, Optional
import json
import logging
from app.core.security import decode_token

logger = logging.getLogger("mindbridge.call_signaling")

router = APIRouter(tags=["call_signaling"])


class CallRoomManager:
    def __init__(self):
        # appointment_id -> list of active client dictionaries
        self.rooms: Dict[int, List[Dict]] = {}

    async def connect(self, websocket: WebSocket, appointment_id: int, user_info: dict):
        await websocket.accept()
        if appointment_id not in self.rooms:
            self.rooms[appointment_id] = []

        client_entry = {
            "ws": websocket,
            "user_id": user_info.get("sub"),
            "role": user_info.get("role"),
            "alias": user_info.get("my_alias"),
        }
        self.rooms[appointment_id].append(client_entry)
        logger.info(f"User {client_entry['alias']} ({client_entry['role']}) joined call room {appointment_id}")

        # Broadcast peer joined to everyone in the room
        await self.broadcast(
            appointment_id,
            {
                "type": "peer-joined",
                "role": client_entry["role"],
                "alias": client_entry["alias"],
                "total_peers": len(self.rooms[appointment_id]),
            },
            exclude_ws=websocket,
        )

        # Notify joining client of existing peers
        existing_peers = [
            {"role": c["role"], "alias": c["alias"]}
            for c in self.rooms[appointment_id]
            if c["ws"] != websocket
        ]
        await websocket.send_text(json.dumps({
            "type": "room-state",
            "peers": existing_peers,
            "total_peers": len(self.rooms[appointment_id]),
        }))

    def disconnect(self, websocket: WebSocket, appointment_id: int) -> Optional[dict]:
        if appointment_id in self.rooms:
            found = None
            for c in list(self.rooms[appointment_id]):
                if c["ws"] == websocket:
                    found = c
                    self.rooms[appointment_id].remove(c)
                    break

            if not self.rooms[appointment_id]:
                del self.rooms[appointment_id]
            return found
        return None

    async def broadcast(self, appointment_id: int, message: dict, exclude_ws: Optional[WebSocket] = None):
        if appointment_id not in self.rooms:
            return
        payload = json.dumps(message)
        for client in list(self.rooms[appointment_id]):
            if exclude_ws is not None and client["ws"] == exclude_ws:
                continue
            try:
                await client["ws"].send_text(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting to client in room {appointment_id}: {e}")

    async def relay_to_peer(self, appointment_id: int, message: dict, sender_ws: WebSocket):
        """Relays a message from sender to the other peer in the 1-on-1 audio call room."""
        if appointment_id not in self.rooms:
            return
        payload = json.dumps(message)
        for client in list(self.rooms[appointment_id]):
            if client["ws"] != sender_ws:
                try:
                    await client["ws"].send_text(payload)
                except Exception as e:
                    logger.warning(f"Error relaying message in room {appointment_id}: {e}")


manager = CallRoomManager()


@router.websocket("/ws/call/{appointment_id}")
@router.websocket("/api/ws/call/{appointment_id}")
async def call_signaling_endpoint(
    websocket: WebSocket,
    appointment_id: int,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for WebRTC audio call signaling.
    Requires a valid call token containing appointment_id and caller role.
    """
    if not token:
        await websocket.close(code=4403, reason="Authentication token missing")
        return

    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4403, reason="Invalid or expired call token")
        return

    token_type = payload.get("token_type")
    token_appt_id = payload.get("appointment_id")

    if token_type != "call_token" or int(token_appt_id) != appointment_id:
        await websocket.close(code=4403, reason="Unauthorized call room access")
        return

    await manager.connect(websocket, appointment_id, payload)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                message = json.loads(raw_data)
            except Exception:
                continue

            msg_type = message.get("type")

            if msg_type in ("offer", "answer", "ice-candidate"):
                # Forward WebRTC signaling to peer
                await manager.relay_to_peer(appointment_id, message, sender_ws=websocket)
            elif msg_type == "mute-state":
                # Broadcast mic mute status
                await manager.relay_to_peer(
                    appointment_id,
                    {
                        "type": "peer-mute-state",
                        "isMuted": message.get("isMuted", False),
                        "role": payload.get("role"),
                    },
                    sender_ws=websocket,
                )
            elif msg_type == "hangup":
                await manager.relay_to_peer(
                    appointment_id,
                    {
                        "type": "call-ended",
                        "reason": message.get("reason", "Call ended by peer"),
                    },
                    sender_ws=websocket,
                )
                break
            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error in call room {appointment_id}: {e}")
    finally:
        client = manager.disconnect(websocket, appointment_id)
        if client:
            await manager.broadcast(
                appointment_id,
                {
                    "type": "peer-left",
                    "role": client["role"],
                    "alias": client["alias"],
                },
            )
