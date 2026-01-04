-- ============================================
-- サンプルデータ
-- フロントエンドのdummyData.jsonに対応するサンプルデータ
-- ============================================

-- テーマを挿入
INSERT INTO themes (id, title, color) VALUES
  ('theme1', '高市政権', '#E57373'),
  ('theme2', '熊の駆除', '#FFD54F'),
  ('theme3', 'トランプ政権', '#81C784');

-- 意見を挿入（theme1: 高市政権）
INSERT INTO opinions (id, theme_id, title, body, score, color, source_url) VALUES
  ('op1', 'theme1', '積極財政', '国債を発行して投資を増やすべき。経済成長には不可欠な要素である。', 80, '#EF9A9A', 'https://example.com/news/fiscal-policy'),
  ('op2', 'theme1', '靖国参拝', '国のリーダーとして英霊に尊崇の念を表すべき。', 90, '#EF9A9A', 'https://example.com/news/yasukuni'),
  ('op1_neg', 'theme1', '財政規律', '将来世代へのツケを回すべきではない。緊縮財政が必要。', -70, '#B0BEC5', 'https://example.com/news/fiscal-discipline');

-- 意見を挿入（theme2: 熊の駆除）
INSERT INTO opinions (id, theme_id, title, body, score, color, source_url) VALUES
  ('op3', 'theme2', '意見1', '人命優先で駆除すべき。被害が出ている以上、躊躇すべきではない。', -80, '#FDD835', 'https://example.com/news/bear-control'),
  ('op4', 'theme2', '意見2', '共存の道を探るべき。むやみな駆除は生態系を破壊する。', 60, '#81C784', 'https://example.com/news/bear-coexistence'),
  ('op5', 'theme2', '意見3', 'ハンターへの補助金を増やす。担い手不足を解消するのが先決。', -20, '#7986CB', 'https://example.com/news/hunter-subsidy');

-- 意見を挿入（theme3: トランプ政権）
INSERT INTO opinions (id, theme_id, title, body, score, color, source_url) VALUES
  ('op6', 'theme3', '関税強化', '自国産業を守るため関税を上げる。アメリカファースト。', 70, '#A5D6A7', 'https://example.com/news/tariff-hike'),
  ('op7', 'theme3', '移民政策', '国境管理を厳格化し、不法移民を強制送還すべき。', 80, '#A5D6A7', 'https://example.com/news/immigration-control'),
  ('op8', 'theme3', '国際協調', '孤立主義は世界経済に悪影響を与える。', -60, '#90CAF9', 'https://example.com/news/global-cooperation');
