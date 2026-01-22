from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
# from app.config import CORS_ORIGINS
from app.services.supabase_service import init_supabase

app = FastAPI(title="Kaleidoscope Backend")

# CORS設定
# 許可するオリジンのリスト
origins = [
    "http://localhost:3000",          # ローカル開発環境用
    "https://cpi-5.vercel.app"
    "https://cpi-5-sawa-team5s-projects.vercel.app", # プロジェクトの共通ドメイン
]

app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins,  # 特定のURLのみ許可
    allow_origins=["*"],  # ここを ["*"] に書き換えると全てのURLを許可します
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

init_supabase()

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "backend running!"}
