-- ============================================
-- データベーススキーマ
-- Supabaseで実行してください
-- ============================================

-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ニューステーブル （仮 やりやすいように変更してください）
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name VARCHAR(10) NOT NULL,
  summary VARCHAR(100) NOT NULL,
  url TEXT,
  agree_score FLOAT NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーの立場スコアテーブル
CREATE TABLE user_stances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE,
  stance_score FLOAT NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, news_id)
);

-- ユーザーの意見アクションテーブル（賛成/反対の履歴）一応保存
CREATE TABLE user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL, -- 'agree' or 'disagree'
  opinion_stance FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_user_stances_user_id ON user_stances(user_id);
CREATE INDEX idx_user_stances_news_id ON user_stances(news_id);
CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX idx_user_actions_news_id ON user_actions(news_id);
