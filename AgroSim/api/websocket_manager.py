import asyncio
from collections import defaultdict
from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self._task_conns: dict[int, set[WebSocket]] = defaultdict(set)
        self._user_conns: dict[int, set[WebSocket]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect_task(self, task_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._task_conns[task_id].add(ws)

    def disconnect_task(self, task_id: int, ws: WebSocket) -> None:
        self._task_conns[task_id].discard(ws)

    async def connect_user(self, user_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._user_conns[user_id].add(ws)

    def disconnect_user(self, user_id: int, ws: WebSocket) -> None:
        self._user_conns[user_id].discard(ws)

    async def _broadcast(self, connections: set[WebSocket], data: dict) -> None:
        dead: set[WebSocket] = set()
        for ws in list(connections):
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        connections -= dead

    async def push_to_task(self, task_id: int, data: dict) -> None:
        await self._broadcast(self._task_conns[task_id], data)

    async def push_to_user(self, user_id: int, data: dict) -> None:
        await self._broadcast(self._user_conns[user_id], data)

    def notify(self, task_id: int, user_id: int, data: dict) -> None:
        """Thread-safe push from background threads to both task and user channels."""
        if not self._loop:
            return
        enriched = {"task_id": task_id, **data}
        asyncio.run_coroutine_threadsafe(self.push_to_task(task_id, enriched), self._loop)
        asyncio.run_coroutine_threadsafe(self.push_to_user(user_id, enriched), self._loop)


ws_manager = WebSocketManager()
