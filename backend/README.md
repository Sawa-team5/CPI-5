# メモ（backend）

（デバッグのために余計なところまで実装しています。マージ時に削除・修正するので無視してください。）

実装機能（現状）：
- **ユーザー登録/ログイン（ニックネーム）**
- **テーマ（themes）配下の意見（opinions）に対する投票（agree/oppose）**
- **投票に応じたユーザー立場スコア（user_stances）の更新**
- **Supabase を DB として利用**

## セットアップ

### 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```


### サーバー起動

```bash
cd backend
uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000
```

サーバーは http://localhost:8000 で起動します。

## 🔌 API エンドポイント

ベースURL: `http://localhost:8000/api`

### Users

#### ユーザー登録

```http
POST /api/users/register
Content-Type: application/json

{
  "nickname": "alice"
}
```

#### ログイン

```http
POST /api/users/login
Content-Type: application/json

{
  "nickname": "alice"
}
```

#### ユーザー情報取得

```http
GET /api/users/{user_id}
```

### News（実態は「テーマ/意見 + 立場スコア」）

#### 投票（賛成/反対）→ 立場スコア更新

フロントエンドの `handleVote` から呼ばれる想定の形です。

```http
POST /api/news/vote
Content-Type: application/json

{
  "currentScore": 0,
  "opinionId": "opinion-1",
  "voteType": "agree"  
}
```

- `voteType` は `'agree'` または `'oppose'`
- `currentScore` は現状リクエストに含まれますが、サーバー側の計算には未使用です
- 現状の実装ではユーザーIDは固定（`test-user-id`）になっています（認証導入後に置き換え予定）

**レスポンス例:**

```json
{
  "newScore": 16.0
}
```

#### ユーザーの立場スコア取得（テーマ単位）

```http
GET /api/news/stance/{user_id}/{theme_id}
```

立場が未作成の場合は `{ "stance_score": 0.0 }` 相当の初期値を返します。

### AI

#### チャット（仮）

現状はダミーで `{"response": "testing"}` を返します。

```http
POST /api/ai/chat?prompt=hello
```

## 📈 スコア計算ロジック（現状）

- 意見スコア（`opinions.score`）とユーザースコア（`user_stances.stance_score`）の範囲は **-100〜100**
- 重み `weight = 0.2`
  - `agree`: 意見の方向へ寄せる
  - `oppose`: 意見の「反対方向」へ寄せる（`target = -opinion_score`）
- 結果は **-100〜100** にクリップ

## 🗄️ データベーステーブル（Supabase）

スキーマは `database/schema.sql` を参照してください。

### users
- `id`: UUID
- `nickname`: VARCHAR(50) UNIQUE

### themes
- `id`: TEXT
- `title`: VARCHAR(100)
- `color`: VARCHAR(20)

### opinions
- `id`: TEXT
- `theme_id`: TEXT (FK → themes.id)
- `title`: VARCHAR(100)
- `body`: TEXT
- `score`: FLOAT (-100〜100)
- `source_url`: TEXT

### user_stances
- `id`: UUID
- `user_id`: UUID (FK → users.id)
- `theme_id`: TEXT (FK → themes.id)
- `stance_score`: FLOAT (-100〜100)
- UNIQUE制約: (user_id, theme_id)

### user_votes
- `id`: UUID
- `user_id`: UUID (FK → users.id)
- `opinion_id`: TEXT (FK → opinions.id)
- `vote_type`: VARCHAR(20) ('agree' or 'oppose')

## CORS設定

現状は `app/main.py` 側で `allow_origins=["*"]` としており、開発環境では全てのオリジンからのリクエストを許可しています。
