# ============================================
# ニュース関連APIルート
# ニュースの取得、立場スコアの更新を担当
# ============================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.news_service import news_service

router = APIRouter()


# ============================================
# リクエスト/レスポンスモデル
# ============================================

class CreateNewsRequest(BaseModel):
    """ニュース作成リクエスト"""
    topic_name: str
    summary: str
    url: str
    agree_score: float = 0.0


class UpdateStanceRequest(BaseModel):
    """立場スコア更新リクエスト"""
    user_id: str
    news_id: str
    action_type: str  # 'agree' or 'disagree'
    opinion_stance: float


class UpdateStanceWithConvictionRequest(BaseModel):
    """納得度による立場スコア更新リクエスト"""
    user_id: str
    news_id: str
    conviction_rating: int  # 1-3


# ============================================
# エンドポイント
# ============================================

@router.get("/all")
async def get_all_news():
    """
    全てのニュースを取得（仮です．自由に変更してください）
    
    フロントエンドで表示するニュース一覧を取得します。
    Supabaseのnewsテーブルから全レコードを取得して返します。
    """
    try:
        news_list = await news_service.get_all_news()
        return {
            "success": True,
            "news": news_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{news_id}")
async def get_news(news_id: str):
    """
    特定のニュースを取得（仮です．自由に変更してください）
    
    指定されたIDのニュース詳細を取得します。
    """
    try:
        news = await news_service.get_news_by_id(news_id)
        if news:
            return {
                "success": True,
                "news": news
            }
        else:
            raise HTTPException(status_code=404, detail="ニュースが見つかりません")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_news(request: CreateNewsRequest):
    """
    新しいニュースを作成（仮です．自由に変更してください）
    
    管理者用のエンドポイント。新しいニュースを登録します。
    """
    try:
        news = await news_service.create_news(
            request.topic_name,
            request.summary,
            request.url,
            request.agree_score
        )
        return {
            "success": True,
            "news": news,
            "message": "ニュースを作成しました"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stance/{user_id}/{news_id}")
async def get_stance(user_id: str, news_id: str):
    """
    ユーザーの特定ニュースに対する立場スコアを取得
    
    フロントエンドで表示するためのユーザーの現在の立場スコアを取得します。
    """
    try:
        stance = await news_service.get_user_stance(user_id, news_id)
        if stance:
            return {
                "success": True,
                "stance": stance
            }
        else:
            # 立場スコアが存在しない場合は初期値を返す
            return {
                "success": True,
                "stance": {
                    "user_id": user_id,
                    "news_id": news_id,
                    "stance_score": 0.0
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stances/{user_id}")
async def get_all_stances(user_id: str):
    """
    ユーザーの全ニュースに対する立場スコアを取得
    
    ユーザーのダッシュボードなどで使用する、全ニュースの立場スコア一覧を取得します。
    """
    try:
        stances = await news_service.get_all_user_stances(user_id)
        return {
            "success": True,
            "stances": stances
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-stance")
async def update_stance(request: UpdateStanceRequest):
    """
    立場スコアを更新
    
    フロントエンドで賛成/反対ボタンが押された時に呼び出されます。
    ユーザーのアクションに基づいて立場スコアを計算・更新します。
    
    計算ロジック：
    - 賛成の場合：現在のスコアと意見のスコアの重み付き平均（意見に寄せる）
    - 反対の場合：現在のスコアと意見の反対スコアの重み付き平均（意見の反対に寄せる）
    """
    try:
        result = await news_service.update_stance_score(
            request.user_id,
            request.news_id,
            request.action_type,
            request.opinion_stance
        )
        return {
            "success": True,
            "stance": result,
            "message": "立場スコアを更新しました"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-stance-conviction")
async def update_stance_with_conviction(request: UpdateStanceWithConvictionRequest):
    """
    納得度に基づいて立場スコアを微調整
    
    AIチャットの会話後、納得度評価に基づいて立場スコアを調整します。
    
    調整ロジック：
    - 1 (あまり納得しなかった): スコアを中立方向に10%戻す
    - 2 (やや納得した): スコアを維持
    - 3 (とても納得した): スコアを現在の方向に10%強める
    """
    try:
        result = await news_service.update_stance_with_conviction(
            request.user_id,
            request.news_id,
            request.conviction_rating
        )
        return {
            "success": True,
            "stance": result,
            "message": "納得度による調整を行いました"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
