from fastapi import APIRouter
from .routes_themes import router as themes_router
from .routes_users import router as users_router
from .routes_ai import router as ai_router
from .routes_news import router as news_router

api_router = APIRouter()

api_router.include_router(themes_router, prefix="/themes", tags=["Themes"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI"])
api_router.include_router(news_router, prefix="/news", tags=["News"])