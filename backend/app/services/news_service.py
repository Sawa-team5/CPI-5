# ============================================
# テーマと意見関連サービス
# テーマと意見の取得、作成、ユーザーの立場スコア計算を担当
# ============================================

from typing import List, Dict, Any, Optional
from app.core.supabase_client import get_supabase
from app.utils.logger import logger


class NewsService:
    """テーマと意見関連のビジネスロジックを提供するサービスクラス"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    # async def get_all_themes(self) -> List[Dict[str, Any]]:
    #     """
    #     全てのテーマと意見を取得する（フロントエンドのJSON構造に合わせる）
        
    #     Returns:
    #         テーマのリスト（各テーマに意見が含まれる）
    #     """
    #     try:
    #         # テーマを取得
    #         themes_result = self.supabase.table("themes").select("*").order("created_at", desc=False).execute()
    #         themes = themes_result.data if themes_result.data else []
            
    #         # 各テーマに対して意見を取得
    #         for theme in themes:
    #             opinions_result = self.supabase.table("opinions").select("*").eq("theme_id", theme["id"]).execute()
    #             opinions = opinions_result.data if opinions_result.data else []
                
    #             # キー名をフロントエンドに合わせる (source_url -> sourceUrl)
    #             for opinion in opinions:
    #                 opinion["sourceUrl"] = opinion.pop("source_url", None)
                
    #             theme["opinions"] = opinions
            
    #         return themes
            
    #     except Exception as e:
    #         logger.error(f"テーマ取得エラー: {str(e)}")
    #         raise
    
    # async def get_theme_by_id(self, theme_id: str) -> Optional[Dict[str, Any]]:
    #     """
    #     特定のテーマとその意見を取得する
        
    #     Args:
    #         theme_id: テーマID
            
    #     Returns:
    #         テーマ情報（意見を含む）
    #     """
    #     try:
    #         # テーマを取得
    #         theme_result = self.supabase.table("themes").select("*").eq("id", theme_id).execute()
    #         if not theme_result.data:
    #             return None
            
    #         theme = theme_result.data[0]
            
    #         # 意見を取得
    #         opinions_result = self.supabase.table("opinions").select("*").eq("theme_id", theme_id).execute()
    #         opinions = opinions_result.data if opinions_result.data else []
            
    #         # キー名をフロントエンドに合わせる
    #         for opinion in opinions:
    #             opinion["sourceUrl"] = opinion.pop("source_url", None)
            
    #         theme["opinions"] = opinions
    #         return theme
            
    #     except Exception as e:
    #         logger.error(f"テーマ取得エラー: {str(e)}")
    #         raise
    
    async def get_user_stance(self, user_id: str, theme_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーの特定テーマに対する立場スコアを取得
        
        Args:
            user_id: ユーザーID
            theme_id: テーマID
            
        Returns:
            立場スコア情報
        """
        try:
            result = self.supabase.table("user_stances").select("*").eq("user_id", user_id).eq("theme_id", theme_id).execute()
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"立場スコア取得エラー: {str(e)}")
            raise
    
    # async def get_all_user_stances(self, user_id: str) -> List[Dict[str, Any]]:
    #     """
    #     ユーザーの全テーマに対する立場スコアを取得
        
    #     Args:
    #         user_id: ユーザーID
            
    #     Returns:
    #         立場スコアのリスト
    #     """
    #     try:
    #         result = self.supabase.table("user_stances").select("*, themes(*)").eq("user_id", user_id).execute()
    #         return result.data if result.data else []
            
    #     except Exception as e:
    #         logger.error(f"立場スコア取得エラー: {str(e)}")
    #         raise
    
    def calculate_new_score(self, current_self_score: float, opinion_score: float, vote_type: str) -> float:
        """
        ユーザースコアを計算
        
        Args:
            current_self_score: 現在のユーザースコア (-100 ~ 100)
            opinion_score: 意見のスコア (-100 ~ 100)
            vote_type: 投票タイプ ('agree' または 'oppose')
            
        Returns:
            新しいスコア (-100 ~ 100)
        """
        weight = 0.2  # 移動の重み
        
        if vote_type == 'agree':
            # 意見の方向に寄せる
            new_score = current_self_score + (opinion_score - current_self_score) * weight
        elif vote_type == 'oppose':
            # 意見の反対方向に寄せる
            # 意見が正（例: 80）なら、反対すると負の方向に移動
            # 意見が負（例: -80）なら、反対すると正の方向に移動
            target_score = -opinion_score
            new_score = current_self_score + (target_score - current_self_score) * weight
        else:
            new_score = current_self_score
        
        # スコアを -100 ~ 100 の範囲に制限
        new_score = max(-100, min(100, new_score))
        
        return new_score
    
    async def update_stance_score(
        self, 
        user_id: str, 
        opinion_id: str, 
        vote_type: str
    ) -> Dict[str, Any]:
        """
        ユーザーの立場スコアを更新する
        賛成/反対投票に基づいてスコアを計算（dummy_backend.jsxのアルゴリズムを使用）
        
        Args:
            user_id: ユーザーID
            opinion_id: 意見ID
            vote_type: 投票タイプ（'agree' または 'oppose'）
            
        Returns:
            更新された立場スコア情報
        """
        try:
            # 意見を取得してテーマIDとスコアを確認
            opinion_result = self.supabase.table("opinions").select("*").eq("id", opinion_id).execute()
            if not opinion_result.data:
                raise ValueError(f"Opinion not found: {opinion_id}")
            
            opinion = opinion_result.data[0]
            theme_id = opinion["theme_id"]
            opinion_score = opinion["score"]
            
            # 現在の立場スコアを取得
            current_stance = await self.get_user_stance(user_id, theme_id)
            
            if current_stance:
                current_score = current_stance["stance_score"]
            else:
                current_score = 0.0
            
            # 新しいスコアを計算（dummy_backend.jsxのアルゴリズム）
            new_score = self.calculate_new_score(current_score, opinion_score, vote_type)
            
            # データベースを更新または挿入
            if current_stance:
                result = self.supabase.table("user_stances").update({
                    "stance_score": new_score
                }).eq("id", current_stance["id"]).execute()
            else:
                result = self.supabase.table("user_stances").insert({
                    "user_id": user_id,
                    "theme_id": theme_id,
                    "stance_score": new_score
                }).execute()
            
            # 投票履歴を記録
            self.supabase.table("user_votes").insert({
                "user_id": user_id,
                "opinion_id": opinion_id,
                "vote_type": vote_type
            }).execute()
            
            logger.info(f"立場スコア更新: user={user_id}, theme={theme_id}, opinion={opinion_id}, score={new_score}")
            
            # レスポンスにnewScoreを含める（フロントエンドの期待に合わせる）
            response = result.data[0] if result.data else {}
            response["newScore"] = new_score
            return response
            
        except Exception as e:
            logger.error(f"立場スコア更新エラー: {str(e)}")
            raise


# シングルトンインスタンス
news_service = NewsService()
