from fastapi import APIRouter
# from app.services.ai_service import ask_ai

router = APIRouter()

@router.post("/chat")
async def chat(prompt: str):
    # result = await ask_ai(prompt)
    return {"response": "testing"}
    # return {"response": result}