# ============================================
# テーマと意見関連APIルート
# テーマと意見の取得、立場スコアの更新を担当
# ============================================

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
from app.services.news_service import news_service

router = APIRouter()


# ============================================
# 依存関数
# ============================================

async def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """
    リクエストヘッダーからユーザーIDを取得
    
    Args:
        x_user_id: X-User-IDヘッダーの値
        
    Returns:
        ユーザーID
        
    Raises:
        HTTPException: ユーザーIDが提供されていない場合
    """
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="認証が必要です。X-User-IDヘッダーを提供してください。"
        )
    return x_user_id


# ============================================
# リクエスト/レスポンスモデル
# ============================================

class VoteRequest(BaseModel):
    """投票リクエスト（フロントエンドに合わせる）"""
    currentScore: float  # 現在のユーザースコア
    opinionId: str       # 意見ID
    voteType: str        # 'agree' または 'oppose'


# ============================================
# エンドポイント
# ============================================

# @router.get("/themes")
# async def get_all_themes():
#     """
#     全てのテーマと意見を取得（フロントエンドのJSON構造に合わせる）
    
#     Returns:
#         {
#           "themes": [
#             {
#               "id": "theme1",
#               "title": "高市政権",
#               "color": "#E57373",
#               "opinions": [...]
#             }
#           ]
#         }
#     """
#     try:
#         themes_list = await news_service.get_all_themes()
#         return {
#             "themes": themes_list
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# @router.get("/themes/{theme_id}")
# async def get_theme(theme_id: str):
#     """
#     特定のテーマと意見を取得
    
#     Args:
#         theme_id: テーマID
#     """
#     try:
#         theme = await news_service.get_theme_by_id(theme_id)
#         if theme:
#             return theme
#         else:
#             raise HTTPException(status_code=404, detail="テーマが見つかりません")
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


@router.post("/vote")
async def vote(request: VoteRequest, user_id: str = Header(alias="X-User-ID")):
    """
    意見に対して投票（賛成/反対）してスコアを更新
    
    フロントエンドのhandleVote関数から呼び出される。    
    Args:
        request: 投票リクエスト
            - currentScore: 現在のユーザースコア (-100 ~ 100)
            - opinionId: 意見のID
            - voteType: 'agree' または 'oppose'
        user_id: ログイン中のユーザーID（X-User-IDヘッダーから取得）
    
    Returns:
        {
          "newScore": 新しいスコア値
        }
    """
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="認証が必要です。ログインしてください。"
        )
    
    try:
        result = await news_service.update_stance_score(
            user_id,
            request.opinionId,
            request.voteType
        )
        
        return {
            "newScore": result.get("newScore", 0.0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stance/{user_id}/{theme_id}")
async def get_stance(user_id: str, theme_id: str):
    """
    ユーザーの特定テーマに対する立場スコアを取得
    
    Args:
        user_id: ユーザーID
        theme_id: テーマID
    """
    try:
        stance = await news_service.get_user_stance(user_id, theme_id)
        if stance:
            return stance
        else:
            # 立場スコアが存在しない場合は初期値を返す
            return {
                "user_id": user_id,
                "theme_id": theme_id,
                "stance_score": 0.0
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# @router.get("/stances/{user_id}")
# async def get_all_stances(user_id: str):
#     """
#     ユーザーの全テーマに対する立場スコアを取得
    
#     Args:
#         user_id: ユーザーID
#     """
#     try:
#         stances = await news_service.get_all_user_stances(user_id)
#         return {
#             "stances": stances
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
