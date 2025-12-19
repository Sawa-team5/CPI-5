# メモ

（デバックのために余計なところまでに実装しています．マージするときに削除・修正するので無視してください．）

実装機能：
- **ユーザー立場スコア計算・管理**

### 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

### サーバー起動

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

サーバーは http://localhost:8000 で起動します。

## 🔌 API エンドポイント

### ユーザー認証

ベースURL: `http://localhost:8000/api`

### ニュース・立場スコア管理

#### 4. 全ニュース取得(仮 自由に変更してください)

```http
GET /api/news/all
```

**レスポンス例:**
```json
{
  "success": true,
  "news": [
    {
      "id": "uuid",
      "topic_name": "裏金問題",
      "summary": "違反議員への厳格な処分が必要という意見と...",
      "url": "https://example.com/news1",
      "agree_score": 0.5,
      "created_at": "2025-12-19T10:00:00Z"
    }
  ]
}
```

#### 5. 特定ニュース取得(仮 自由に変更してください)

```http
GET /api/news/{news_id}
```

#### 6. ニュース作成(仮 自由に変更してください)

```http
POST /api/news/create
Content-Type: application/json

{
  "topic_name": "トピック名",
  "summary": "要約（100文字以内）",
  "url": "https://example.com/news",
  "agree_score": 0.5
}
```

#### 7. ユーザーの立場スコア取得

```http
GET /api/news/stance/{user_id}/{news_id}
```

**レスポンス例:**
```json
{
  "success": true,
  "stance": {
    "id": "uuid",
    "user_id": "user-uuid",
    "news_id": "news-uuid",
    "stance_score": 0.75,
    "created_at": "2025-12-19T10:00:00Z",
    "updated_at": "2025-12-19T10:00:00Z"
  }
}
```

#### 8. ユーザーの全立場スコア取得

```http
GET /api/news/stances/{user_id}
```

#### 9. 立場スコア更新（賛成/反対アクション）

```http
POST /api/news/update-stance
Content-Type: application/json

{
  "user_id": "user-uuid",
  "news_id": "news-uuid",
  "action_type": "agree",  // 'agree' or 'disagree'
  "opinion_stance": 0.8    // -1.0 ~ 1.0
}
```

**レスポンス例:**
```json
{
  "success": true,
  "stance": {
    "id": "uuid",
    "user_id": "user-uuid",
    "news_id": "news-uuid",
    "stance_score": 0.73,
    "updated_at": "2025-12-19T10:00:00Z"
  },
  "message": "立場スコアを更新しました"
}
```

**計算ロジック（仮）:**
- **賛成 (agree)**: `new_score = (current_score * 2 + opinion_stance) / 3`
- **反対 (disagree)**: `new_score = (current_score * 2 - opinion_stance) / 3`
- スコアは-1.0~1.0の範囲に制限
- user_actionsテーブルに履歴を記録

#### 10. 納得度による立場スコア微調整

```http
POST /api/news/update-stance-conviction
Content-Type: application/json

{
  "user_id": "user-uuid",
  "news_id": "news-uuid",
  "conviction_rating": 3  // 1, 2, or 3
}
```

**調整ロジック（仮）:**
- **1 (あまり納得しなかった)**: `new_score = current_score * 0.9` (中立方向に10%戻す)
- **2 (やや納得した)**: スコアを維持
- **3 (とても納得した)**: `new_score = current_score * 1.1` (現在の方向に10%強める)

## 🗄️ データベーステーブル

### news（仮 自由に変更してください）
ニュース/トピック情報を保存
- `id`: UUID (主キー)
- `topic_name`: VARCHAR(10)
- `summary`: VARCHAR(100)
- `url`: TEXT
- `agree_score`: FLOAT
- `created_at`, `updated_at`: タイムスタンプ

### user_stances
ユーザーの各ニュースに対する立場スコアを保存
- `id`: UUID (主キー)
- `user_id`: UUID (外部キー → users)
- `news_id`: UUID (外部キー → news)
- `stance_score`: FLOAT (-1.0 ~ 1.0)
- `created_at`, `updated_at`: タイムスタンプ
- UNIQUE制約: (user_id, news_id)

### user_actions
ユーザーの賛成/反対アクションの履歴
- `id`: UUID (主キー)
- `user_id`: UUID (外部キー → users)
- `news_id`: UUID (外部キー → news)
- `action_type`: VARCHAR(20) ('agree' or 'disagree')
- `opinion_stance`: FLOAT
- `created_at`: タイムスタンプ


### 立場スコア管理フロー 

1. **ニュース一覧表示（仮）:**
   - `/api/news/all` で全ニュースを取得
   - 各ニュースのagree_scoreを表示

2. **ユーザーの立場スコア表示:**
   - `/api/news/stance/{user_id}/{news_id}` で個別取得
   - または `/api/news/stances/{user_id}` で全取得
   - stance_scoreを-1.0~1.0のスケールで可視化

3. **賛成/反対ボタン:**
   - ボタンクリック時に `/api/news/update-stance` を呼び出し
   - `action_type`: 'agree' または 'disagree'
   - `opinion_stance`: ユーザーの意見の強さ（-1.0~1.0）

4. **納得度評価:**
   - チャット後に `/api/news/update-stance-conviction` を呼び出し
   - `conviction_rating`: 1, 2, 3のいずれか

### スコアの解釈

- **stance_score**:
  - `1.0`: 強く賛成
  - `0.0`: 中立
  - `-1.0`: 強く反対

### CORS設定

開発環境では全てのオリジンからのリクエストを許可しています。
フロントエンドから直接APIを呼び出せます。

### エラーハンドリング

- HTTPステータス 200: 成功
- HTTP ステータス 400: バリデーションエラー
- HTTP ステータス 404: リソースが見つからない
- HTTP ステータス 500: サーバーエラー
