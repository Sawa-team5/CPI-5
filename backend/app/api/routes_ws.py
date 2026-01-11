from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ws_manager import ws_manager
from app.utils.logger import logger

router = APIRouter()

@router.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    """
    1通目に必ず hello を送る:
    {"type":"hello","userId":"..."}
    """
    user_id = None
    conn_id = None

    try:
        hello = await ws.receive_json()
        if hello.get("type") != "hello" or not hello.get("userId"):
            await ws.close(code=1008)
            return

        user_id = str(hello["userId"])
        conn_id = await ws_manager.connect(user_id, ws)

        while True:
            msg = await ws.receive_json()
            logger.info(f"WS recv user={user_id} type={msg.get('type')}")

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WS error: {type(e).__name__} {str(e)}")
    finally:
        if user_id and conn_id:
            ws_manager.disconnect(user_id, conn_id)
