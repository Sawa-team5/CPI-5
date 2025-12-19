# ============================================
# ユーザー関連サービス
# ユーザーの登録、認証、情報取得を担当
# ============================================

from typing import Optional, Dict, Any
from app.core.supabase_client import get_supabase
from app.utils.logger import logger


class UserService:
    """ユーザー関連のビジネスロジックを提供するサービスクラス"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    async def register_user(self, nickname: str) -> Dict[str, Any]:
        """
        新規ユーザーを登録する
        
        Args:
            nickname: ユーザーのニックネーム
            
        Returns:
            作成されたユーザー情報
            
        Raises:
            Exception: ニックネームが既に存在する場合
        """
        try:
            # ニックネームの重複チェック
            existing = self.supabase.table("users").select("*").eq("nickname", nickname).execute()
            if existing.data:
                raise Exception("このニックネームは既に使用されています")
            
            # ユーザーを作成
            result = self.supabase.table("users").insert({
                "nickname": nickname
            }).execute()
            
            logger.info(f"新規ユーザー登録: {nickname}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            logger.error(f"ユーザー登録エラー: {str(e)}")
            raise
    
    async def login_user(self, nickname: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーをニックネームでログインさせる
        
        Args:
            nickname: ユーザーのニックネーム
            
        Returns:
            ユーザー情報（存在しない場合はNone）
        """
        try:
            result = self.supabase.table("users").select("*").eq("nickname", nickname).execute()
            
            if result.data:
                logger.info(f"ユーザーログイン: {nickname}")
                return result.data[0]
            else:
                logger.warning(f"ユーザーが見つかりません: {nickname}")
                return None
                
        except Exception as e:
            logger.error(f"ユーザーログインエラー: {str(e)}")
            raise
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーIDからユーザー情報を取得
        
        Args:
            user_id: ユーザーID
            
        Returns:
            ユーザー情報（存在しない場合はNone）
        """
        try:
            result = self.supabase.table("users").select("*").eq("id", user_id).execute()
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"ユーザー取得エラー: {str(e)}")
            raise


# シングルトンインスタンス
user_service = UserService()
