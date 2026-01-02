from pydantic import BaseModel

class AIChatRequest(BaseModel):
    prompt: str

class AIChatResponse(BaseModel):
    response: str