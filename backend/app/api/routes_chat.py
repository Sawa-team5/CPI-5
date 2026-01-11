from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        result = await chat_service.chat(
            session_id=req.sessionId,
            message=req.message,
            theme_title=req.themeTitle,
            stance_score=req.stanceScore,
            agreed_opinion=req.agreedOpinion,
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))