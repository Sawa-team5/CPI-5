# backend/app/services/news_service.py

# ユーザーの立ち位置データ
user_stances_db = {}

# 意見のスコアを覚えておく場所
opinion_scores_cache = {} 

# ★追加: 投票履歴を管理する辞書 (user_id: {opinion_id1, opinion_id2, ...})
user_vote_history = {}

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
        # --- ★重複投票チェック ---
        # 履歴が存在し、かつ今回のopinion_idが含まれているか確認
        if user_id in user_vote_history and opinion_id in user_vote_history[user_id]:
            raise Exception("すでにこの意見に投票済みです")
        
        # 履歴がない場合は新規作成
        if user_id not in user_vote_history:
            user_vote_history[user_id] = set()
        
        # 今回の投票を履歴に追加
        user_vote_history[user_id].add(opinion_id)

        # --- 既存のスコア計算・保存処理 ---
        opinion_score = self._get_opinion_score(opinion_id)
        
        # ユーザーの現在地取得
        user_data = user_stances_db.get(user_id, {})
        current_score = user_data.get(theme_id, 0.0)

        # 影響率
        INFLUENCE_RATE = 0.5
        move_amount = 0.0

        if vote_type == 'agree':
            # 【賛成】差を縮める（引力）
            move_amount = opinion_score * INFLUENCE_RATE
        elif vote_type == 'oppose':
            # 【反対】差を広げる（反発力）
            move_amount = -1 * (opinion_score * INFLUENCE_RATE)

        # 微調整: 動きが小さすぎるときの最低保証
        # (※賛成時のみの処理として記述されていますが、必要に応じて反対時も考慮するとより良くなります)
        if vote_type == 'agree':
            if 0 < move_amount < 1: move_amount = 1
            if -1 < move_amount < 0: move_amount = -1

        new_score = current_score + move_amount

        # 範囲制限 (-100 ~ 100)
        # new_score = max(-100.0, min(100.0, new_score))

        # 保存
        if user_id not in user_stances_db:
            user_stances_db[user_id] = {}
        user_stances_db[user_id][theme_id] = new_score

        print(f"Update: {current_score:.1f} -> {new_score:.1f} (Target:{opinion_score}, Move:{move_amount:.1f})")

        return {
            "newScore": new_score,
            "delta": new_score - current_score
        }

    # クラス内のプライベートメソッド
    def _get_opinion_score(self, opinion_id):
        return opinion_scores_cache.get(opinion_id, 0.0)

# ★★★ クラスの外側でインスタンス化 ★★★
news_service = NewsService()