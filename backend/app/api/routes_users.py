# ============================================
# ユーザー関連APIルート
# ============================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.user_service import user_service

router = APIRouter()


# ============================================
# リクエスト/レスポンスモデル
# ============================================

class RegisterRequest(BaseModel):
    """ユーザー登録リクエスト"""
    nickname: str


class LoginRequest(BaseModel):
    """ログインリクエスト"""
    nickname: str


# ============================================
# エンドポイント
# ============================================

@router.post("/register")
async def register(request: RegisterRequest):
    """
    新規ユーザーを登録
    
    フロントエンドから送信されたニックネームで新しいユーザーを作成します。
    ニックネームは一意である必要があります。
    """
    try:
        user = await user_service.register_user(request.nickname)
        return {
            "success": True,
            "user": user,
            "message": f"ユーザー '{request.nickname}' を登録しました"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(request: LoginRequest):
    """
    ユーザーログイン
    
    フロントエンドから送信されたニックネームでユーザーを認証します。
    存在するニックネームの場合、ユーザー情報を返します。
    """
    try:
        user = await user_service.login_user(request.nickname)
        if user:
            return {
                "success": True,
                "user": user,
                "message": f"ようこそ、{request.nickname}さん"
            }
        else:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_user(user_id: str):
    """
    ユーザー情報を取得
    
    指定されたユーザーIDの情報を取得します。
    """
    try:
        user = await user_service.get_user_by_id(user_id)
        if user:
            return {
                "success": True,
                "user": user
            }
        else:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))