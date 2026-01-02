from fastapi import APIRouter
from app.schemas.themes import ThemesResponse
from app.services.theme_store_service import list_themes_with_opinions

router = APIRouter()

@router.get("/", response_model=ThemesResponse)
def get_themes():
    return list_themes_with_opinions()