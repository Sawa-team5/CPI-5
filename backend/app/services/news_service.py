# ============================================
# ニュース関連サービス
# ニュースの取得、作成、ユーザーの立場スコア計算を担当
# ============================================

from typing import List, Dict, Any, Optional
from app.core.supabase_client import get_supabase
from app.utils.logger import logger


class NewsService:
    """ニュース関連のビジネスロジックを提供するサービスクラス"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    async def get_all_news(self) -> List[Dict[str, Any]]:
        """
        全てのニュースを取得する
        
        Returns:
            ニュースのリスト
        """
        try:
            result = self.supabase.table("news").select("*").order("created_at", desc=True).execute()
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"ニュース取得エラー: {str(e)}")
            raise
    
    async def get_news_by_id(self, news_id: str) -> Optional[Dict[str, Any]]:
        """
        特定のニュースを取得する
        
        Args:
            news_id: ニュースID
            
        Returns:
            ニュース情報
        """
        try:
            result = self.supabase.table("news").select("*").eq("id", news_id).execute()
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"ニュース取得エラー: {str(e)}")
            raise
    
    async def create_news(self, topic_name: str, summary: str, url: str, agree_score: float) -> Dict[str, Any]:
        """
        新しいニュースを作成する
        
        Args:
            topic_name: トピック名（10文字以内）
            summary: まとめ（100文字以内）
            url: ニュースのURL
            agree_score: 賛成スコア
            
        Returns:
            作成されたニュース情報
        """
        try:
            result = self.supabase.table("news").insert({
                "topic_name": topic_name[:10],  # 10文字に制限
                "summary": summary[:100],  # 100文字に制限
                "url": url,
                "agree_score": agree_score
            }).execute()
            
            logger.info(f"新規ニュース作成: {topic_name}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            logger.error(f"ニュース作成エラー: {str(e)}")
            raise
    
    async def get_user_stance(self, user_id: str, news_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーの特定ニュースに対する立場スコアを取得
        
        Args:
            user_id: ユーザーID
            news_id: ニュースID
            
        Returns:
            立場スコア情報
        """
        try:
            result = self.supabase.table("user_stances").select("*").eq("user_id", user_id).eq("news_id", news_id).execute()
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"立場スコア取得エラー: {str(e)}")
            raise
    
    async def get_all_user_stances(self, user_id: str) -> List[Dict[str, Any]]:
        """
        ユーザーの全ニュースに対する立場スコアを取得
        
        Args:
            user_id: ユーザーID
            
        Returns:
            立場スコアのリスト
        """
        try:
            result = self.supabase.table("user_stances").select("*, news(*)").eq("user_id", user_id).execute()
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"立場スコア取得エラー: {str(e)}")
            raise
    
    async def update_stance_score(
        self, 
        user_id: str, 
        news_id: str, 
        action_type: str, 
        opinion_stance: float
    ) -> Dict[str, Any]:
        """
        ユーザーの立場スコアを更新する
        賛成/反対アクションに基づいてスコアを計算
        
        Args:
            user_id: ユーザーID
            news_id: ニュースID
            action_type: アクションタイプ（'agree' または 'disagree'）
            opinion_stance: 意見の立場スコア (-1.0 ~ 1.0)
            
        Returns:
            更新された立場スコア情報
        """
        try:
            # 現在の立場スコアを取得
            current_stance = await self.get_user_stance(user_id, news_id)
            
            if current_stance:
                current_score = current_stance["stance_score"]
            else:
                current_score = 0.0
            
            # 新しいスコアを計算
            # 賛成の場合：意見の方向に寄せる
            # 反対の場合：意見の反対方向に寄せる
            if action_type == "agree":
                new_score = (current_score * 2 + opinion_stance) / 3
            else:  # disagree
                opposite_stance = -opinion_stance
                new_score = (current_score * 2 + opposite_stance) / 3
            
            # スコアを-1.0~1.0の範囲に制限
            new_score = max(-1.0, min(1.0, new_score))
            
            # データベースを更新または挿入
            if current_stance:
                result = self.supabase.table("user_stances").update({
                    "stance_score": new_score
                }).eq("id", current_stance["id"]).execute()
            else:
                result = self.supabase.table("user_stances").insert({
                    "user_id": user_id,
                    "news_id": news_id,
                    "stance_score": new_score
                }).execute()
            
            # アクション履歴を記録
            self.supabase.table("user_actions").insert({
                "user_id": user_id,
                "news_id": news_id,
                "action_type": action_type,
                "opinion_stance": opinion_stance
            }).execute()
            
            logger.info(f"立場スコア更新: user={user_id}, news={news_id}, score={new_score}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            logger.error(f"立場スコア更新エラー: {str(e)}")
            raise
    
    async def update_stance_with_conviction(
        self,
        user_id: str,
        news_id: str,
        conviction_rating: int
    ) -> Dict[str, Any]:
        """
        納得度評価に基づいて立場スコアを微調整
        
        Args:
            user_id: ユーザーID
            news_id: ニュースID
            conviction_rating: 納得度 (1: あまり納得しなかった, 2: やや納得した, 3: とても納得した)
            
        Returns:
            更新された立場スコア情報
        """
        try:
            current_stance = await self.get_user_stance(user_id, news_id)
            
            if not current_stance:
                raise Exception("立場スコアが存在しません")
            
            current_score = current_stance["stance_score"]
            
            # 納得度に応じてスコアを微調整
            # 1: スコアを0方向に10%戻す（あまり納得しなかった）
            # 2: スコアを維持（やや納得した）
            # 3: スコアを現在の方向に10%強める（とても納得した）
            if conviction_rating == 1:
                adjustment_factor = 0.9
                new_score = current_score * adjustment_factor
            elif conviction_rating == 2:
                new_score = current_score  # 変更なし
            else:  # conviction_rating == 3
                adjustment_factor = 1.1
                new_score = current_score * adjustment_factor
            
            # スコアを-1.0~1.0の範囲に制限
            new_score = max(-1.0, min(1.0, new_score))
            
            # データベースを更新
            result = self.supabase.table("user_stances").update({
                "stance_score": new_score
            }).eq("id", current_stance["id"]).execute()
            
            logger.info(f"納得度による立場スコア更新: user={user_id}, news={news_id}, rating={conviction_rating}, score={new_score}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            logger.error(f"納得度更新エラー: {str(e)}")
            raise


# シングルトンインスタンス
news_service = NewsService()
