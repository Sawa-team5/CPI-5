from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    sessionId: str = Field(..., description="WS/ChatMode セッションID")
    message: str = Field("", description="ユーザー入力（初回は空文字OK）")

    themeTitle: Optional[str] = None
    stanceScore: Optional[int] = Field(default=None, ge=-100, le=100)
    agreedOpinion: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool = True
    reply: str
    step: int