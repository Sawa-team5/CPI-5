import json
import uuid
from typing import Dict

from fastapi import WebSocket
from app.utils.logger import logger

class WSManager:
    """
    user_id ごとに WebSocket 接続を保持　（複数タブ対応）
    """
    def __init__(self) -> None:
        self._connections: Dict[str, Dict[str, WebSocket]] = {} # user_id -> conn_id -> ws

    async def register(self, user_id: str, ws: WebSocket) -> str:
        conn_id = str(uuid.uuid4())
        self._connections.setdefault(user_id, {})
        self._connections[user_id][conn_id] = ws
        logger.info(f"WS connected user={user_id} conn={conn_id}")
        return conn_id
    
    def disconnect(self, user_id: str, conn_id: str) -> None:
        if user_id in self._connections:
            self._connections[user_id].pop(conn_id, None)
            if not self._connections[user_id]:
                self._connections.pop(user_id, None)     
        logger.info(f"WS disconnected user={user_id} conn={conn_id}")

    async def send_json(self, user_id: str, payload: dict) -> bool:
        conns = self._connections.get(user_id)
        if not conns:
            return False
        
        msg = json.dumps(payload, ensure_ascii=False)
        dead = []
        sent_any = False

        for conn_id, ws in conns.items():
            try:
                await ws.send_text(msg)
                sent_any = True
            except Exception:
                dead.append(conn_id)

        for conn_id in dead:
            self.disconnect(user_id, conn_id)

        return sent_any
    
ws_manager = WSManager()