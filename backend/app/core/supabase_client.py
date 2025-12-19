# ============================================
# Supabaseクライアント
# データベース接続を管理
# ============================================

from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY
import sys

# 環境変数のバリデーション
if not SUPABASE_URL or SUPABASE_URL == "":
    print("=" * 80)
    print("エラー: SUPABASE_URLが設定されていません")
    print("=" * 80)
    print()
    print("以下の手順でSupabaseを設定してください:")
    print()
    print("1. https://supabase.com/ でアカウントを作成")
    print("2. 新しいプロジェクトを作成")
    print("3. SQL Editorで database/schema.sql を実行")
    print("4. Settings > API から以下を取得:")
    print("   - Project URL (SUPABASE_URL)")
    print("   - anon/public key (SUPABASE_KEY)")
    print()
    print("5. backend/.env ファイルに以下のように設定:")
    print("   SUPABASE_URL=https://xxxxx.supabase.co")
    print("   SUPABASE_KEY=your_anon_key_here")
    print()
    print("=" * 80)
    sys.exit(1)

if not SUPABASE_KEY or SUPABASE_KEY == "":
    print("=" * 80)
    print("エラー: SUPABASE_KEYが設定されていません")
    print("=" * 80)
    print()
    print("backend/.env ファイルにSupabaseのanon keyを設定してください")
    print("Settings > API から anon/public key を取得できます")
    print()
    print("=" * 80)
    sys.exit(1)

# Supabaseクライアントのシングルトンインスタンス
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"✓ Supabaseに接続しました: {SUPABASE_URL}")
except Exception as e:
    print("=" * 80)
    print("エラー: Supabaseクライアントの初期化に失敗しました")
    print("=" * 80)
    print(f"詳細: {str(e)}")
    print()
    print("SUPABASE_URLとSUPABASE_KEYが正しいか確認してください")
    print("=" * 80)
    sys.exit(1)

def get_supabase() -> Client:
    """
    Supabaseクライアントを取得する
    
    Returns:
        Client: Supabaseクライアント
    """
    return supabase
