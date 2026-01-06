from pydantic import BaseModel, Field
from typing import Optional

class SeedThemeRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=60)
    max_items: int = Field(default=12, ge=6, le=16)
    theme_statement: Optional[str] = None