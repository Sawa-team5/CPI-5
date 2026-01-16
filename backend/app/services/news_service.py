# backend/app/services/news_service.py

# 簡易的なインメモリDB（本番ではSupabaseなどを使ってください）
# 構造: { "user_id": { "theme_id": score } }
user_stances_db = {}

# 意見データのキャッシュ（計算用）
# 構造: { "opinion_id": score }
opinion_scores_cache = {} 

class NewsService:
    async def get_user_stance(self, user_id: str, theme_id: str):
        """ユーザーの現在のスタンスを取得"""
        user_data = user_stances_db.get(user_id, {})
        score = user_data.get(theme_id, 0.0)
        return {"user_id": user_id, "theme_id": theme_id, "stance_score": score}

    async def update_stance_score(self, user_id: str, opinion_id: str, vote_type: str):
        """投票に基づいてスコアを更新する核心ロジック"""
        
        # 1. 意見のスコアを取得（本来はDBから引くが、今はキャッシュや引数から取る想定）
        # ※ ここでは簡易的に、意見IDが見つからなければ「極端な意見(±50)」と仮定して動かします
        # 実際には main.py で保存した opinions から検索するのが正しいです
        opinion_score = self._get_opinion_score(opinion_id)
        
        # 2. 現在のユーザースコアを取得（テーマIDが必要だが、簡易実装のため省略し、グローバルなスコアとするか、
        # あるいは「意見ID」から「テーマID」を引ける仕組みが必要）
        # ここでは仮に "current_theme" という一つのテーマに対して計算します
        theme_id = "current_theme" 
        
        user_data = user_stances_db.get(user_id, {})
        current_score = user_data.get(theme_id, 0.0)

        # --- 計算ロジック ---
        # ユーザーを意見の位置に「近づける（賛成）」か「遠ざける（反対）」か
        
        movement_rate = 0.2  # 一回の投票で距離の20%分移動する（慣性）

        if vote_type == 'agree':
            # 賛成: 意見のスコアに近づく
            # 新スコア = 現在 + (目標 - 現在) * 0.2
            new_score = current_score + (opinion_score - current_score) * movement_rate
            
        elif vote_type == 'oppose':
            # 反対: 意見のスコアから遠ざかる（逆方向へ移動）
            # 新スコア = 現在 - (目標 - 現在) * 0.1 (反対は少し慎重に動かす)
            new_score = current_score - (opinion_score - current_score) * 0.1
        
        else:
            new_score = current_score

        # 範囲制限 (-100 ~ 100)
        new_score = max(-100.0, min(100.0, new_score))

        # 保存
        if user_id not in user_stances_db:
            user_stances_db[user_id] = {}
        user_stances_db[user_id][theme_id] = new_score

        return {
            "newScore": new_score,
            "delta": new_score - current_score
        }

    def _get_opinion_score(self, opinion_id):
        """
        意見IDからその意見のスコア(-100~100)を返す。
        本来はDB検索。ここではAIが作った意見を一時的に保存していないため、
        仮にランダムあるいは固定値を返す（動作確認用）
        """
        # ★本番実装時は、main.py で保存した opinions リストから検索してください
        return 50.0 # 仮の値

news_service = NewsService()