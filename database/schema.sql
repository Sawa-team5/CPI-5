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

-- テーマテーブル
CREATE TABLE themes (
  id TEXT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 意見テーブル（opinions）
CREATE TABLE opinions (
  id TEXT PRIMARY KEY,
  theme_id TEXT REFERENCES themes(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  score FLOAT NOT NULL CHECK (score >= -100 AND score <= 100),
  color VARCHAR(20) NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーの立場スコアテーブル (各テーマに対する全体スコア)
CREATE TABLE user_stances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme_id TEXT REFERENCES themes(id) ON DELETE CASCADE,
  stance_score FLOAT NOT NULL DEFAULT 0.0 CHECK (stance_score >= -100 AND stance_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, theme_id)
);

-- ユーザーの投票履歴テーブル（賛成/反対の履歴）
CREATE TABLE user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  opinion_id TEXT REFERENCES opinions(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL, -- 'agree' or 'oppose'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_opinions_theme_id ON opinions(theme_id);
CREATE INDEX idx_user_stances_user_id ON user_stances(user_id);
CREATE INDEX idx_user_stances_theme_id ON user_stances(theme_id);
CREATE INDEX idx_user_votes_user_id ON user_votes(user_id);
CREATE INDEX idx_user_votes_opinion_id ON user_votes(opinion_id);
