from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from api.websocket_manager import ws_manager
from database.db import SessionLocal
from database.models import User
from database.task_store import get_task
from services.auth import decode_token

router = APIRouter()


def _authenticate(token: str) -> int | None:
    """Decode JWT from query param and return user_id, or None if invalid."""
    email = decode_token(token)
    if not email:
        return None
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        return user.id if user else None
    finally:
        db.close()


@router.websocket("/simulate/{task_id}")
async def ws_simulate_task(
    websocket: WebSocket,
    task_id: int,
    token: str = Query(...),
):
    """
    Subscribe to real-time progress of a specific simulation task.

    Connect: ws://host/api/ws/simulate/{task_id}?token=<jwt>

    Messages pushed by the server:
      {"task_id": N, "type": "status",   "status": "running"|"done"|"error", ...}
      {"task_id": N, "type": "progress", "step": "...", "percent": 0-100}
      {"task_id": N, "type": "done",     "simulation_id": N, ...}
      {"task_id": N, "type": "error",    "message": "..."}

    Send any text frame to keep the connection alive (ping).
    """
    user_id = _authenticate(token)
    if user_id is None:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    task = get_task(task_id)
    if not task:
        await websocket.close(code=4004, reason="Task not found")
        return
    if task.get("user_id") != user_id:
        await websocket.close(code=4003, reason="Access denied")
        return

    await ws_manager.connect_task(task_id, websocket)
    try:
        # Send current state immediately so the client doesn't have to wait for the next event.
        snapshot = get_task(task_id)
        if snapshot:
            status = snapshot["status"]
            msg: dict = {"task_id": task_id, "type": "status", "status": status}
            if status == "done":
                msg["result"] = snapshot.get("result")
            elif status == "error":
                msg["message"] = snapshot.get("error")
            await websocket.send_json(msg)

        while True:
            try:
                await websocket.receive_text()  # ping / keep-alive
            except WebSocketDisconnect:
                break
    finally:
        ws_manager.disconnect_task(task_id, websocket)


@router.websocket("/tasks")
async def ws_user_tasks(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    Subscribe to all task events for the authenticated user.

    Connect: ws://host/api/ws/tasks?token=<jwt>

    Receives the same message shapes as /ws/simulate/{task_id} but for every
    task that belongs to this user, so the client can update a task list in one place.
    """
    user_id = _authenticate(token)
    if user_id is None:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await ws_manager.connect_user(user_id, websocket)
    try:
        while True:
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        ws_manager.disconnect_user(user_id, websocket)
