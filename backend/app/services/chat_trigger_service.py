from typing import Dict, Tuple, Optional
from app.services.ws_manager import ws_manager
from app.utils.logger import logger

THRESHOLD = 40

class ChatTriggerService:
    def __init__(self) -> None:
        self._last_score: Dict[Tuple[str, str], int] = {} # (user_id, theme_id) -> last_score

    def _is_skewed(self, score: float) -> bool:
        return abs(score) >= THRESHOLD
    
    def _crossed(self, prev: Optional[float], now: float):
        if prev is None:
            return self._is_skewed(now)
        return (not self._is_skewed(prev)) and self._is_skewed(now)
    
    async def maybe_trigger(self, user_id: str, theme_id: str, new_score: float) -> bool:
        key = (str(user_id), str(theme_id))
        prev = self._last_score.get(key)
        self._last_score[key] = new_score

        if not self._crossed(prev, new_score):
            return False
        
        payload = {
            "type": "chat_trigger",
            "themeId": theme_id,
            "stanceScore": new_score,
            "theshold": THRESHOLD,
        }

        sent = await ws_manager.send_json(str(user_id), payload)
        logger.info(f"chat_trigger user={user_id} theme={theme_id} score={new_score} sent={sent}")
        return sent
    
chat_trigger_service = ChatTriggerService()