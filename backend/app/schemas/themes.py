from pydantic import BaseModel, Field, HttpUrl
from typing import List

class OpinionOut(BaseModel):
    id: str
    title: str
    body: str
    score: int = Field(ge=-100, le=100)
    color: str
    sourceUrl: HttpUrl

class ThemeOut(BaseModel):
    id: str
    title: str
    color: str
    opinions: List[OpinionOut]

class ThemesResponse(BaseModel):
    themes: List[ThemeOut]