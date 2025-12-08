from fastapi import APIRouter
from .routes_users import router as users_router
from .routes_ai import router as ai_router

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI"])