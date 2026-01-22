# backend/app/services/news_service.py

# ユーザーの立ち位置データ
user_stances_db = {}

# 意見のスコアを覚えておく場所
opinion_scores_cache = {} 

class NewsService:
    # AIが作った意見のスコアを登録するメソッド
    def register_opinion(self, opinion_id: str, score: float):
        opinion_scores_cache[opinion_id] = score

    async def get_user_stance(self, user_id: str, theme_id: str):
        """ユーザーの現在のスタンスを取得"""
        user_data = user_stances_db.get(user_id, {})
        score = user_data.get(theme_id, 0.0)
        return {"user_id": user_id, "theme_id": theme_id, "stance_score": score}

    async def update_stance_score(self, user_id: str, theme_id: str, opinion_id: str, vote_type: str):
        # 1. 意見の本当のスコアを取得
        opinion_score = self._get_opinion_score(opinion_id)
        
        # ユーザーの現在地取得
        user_data = user_stances_db.get(user_id, {})
        current_score = user_data.get(theme_id, 0.0)

        # --- 計算ロジック ---

        # 影響率
        INFLUENCE_RATE = 0.5

        move_amount = 0.0 # 初期化

        if vote_type == 'agree':
            # 【賛成】差を縮める（引力）
            move_amount = opinion_score * INFLUENCE_RATE
            
        elif vote_type == 'oppose':
            # 【反対】差を広げる（反発力）
            # 逆方向に動く
            move_amount = -1 * (opinion_score * INFLUENCE_RATE)

        # --------------------------------------------------

        # 微調整: 動きが小さすぎるときの最低保証
        if vote_type == 'agree':
            if 0 < move_amount < 1: move_amount = 1
            if -1 < move_amount < 0: move_amount = -1

        new_score = current_score + move_amount

        # 範囲制限 (-100 ~ 100)
        new_score = max(-100.0, min(100.0, new_score))

        # 保存
        if user_id not in user_stances_db:
            user_stances_db[user_id] = {}
        user_stances_db[user_id][theme_id] = new_score

        print(f"Update: {current_score:.1f} -> {new_score:.1f} (Target:{opinion_score}, Move:{move_amount:.1f})")

        return {
            "newScore": new_score,
            "delta": new_score - current_score
        }

    # ★インデント注意: ここはクラスの中に含める
    def _get_opinion_score(self, opinion_id):
        return opinion_scores_cache.get(opinion_id, 0.0)

# ★★★ ここが重要！ ★★★
# クラスの外側（一番左端）に書くこと
news_service = NewsService()