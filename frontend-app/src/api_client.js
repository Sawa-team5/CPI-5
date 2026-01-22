// src/api_client.js

// PythonサーバーのURL (FastAPI)
// 環境変数があればそれを使い、なければローカル（開発用）を使います
export const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const API_BASE_URL = `${BASE_URL}/api`;

// 1. 全テーマを取得 (初期表示用)
export const fetchThemes = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/themes`);
    if (!res.ok) throw new Error("テーマ取得エラー");
    return await res.json();
  } catch (e) {
    console.error(e);
    return { themes: [] };
  }
};

// 2. 新しいテーマをAIで生成
export const createThemeByAI = async (topic) => {
  try {
    const res = await fetch(`${API_BASE_URL}/opinions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) throw new Error("AI生成エラー");
    return await res.json();
  } catch (e) {
    throw e;
  }
};

// 3. チャット送信 (ChatModeで使う用 - 旧実装)
export const sendChatMessage = async (topic, viewpoint, content, history) => {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, viewpoint, content, history }),
  });
  return await res.json();
};

// 4. 分析実行 (ChatModeで使う用)
export const analyzePosition = async (topic, history) => {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, history }),
  });
  return await res.json();
};

// 5. サイドバー用AIチャット (今回追加する機能)
// main.py で @app.post("/simple-chat") と定義したので、/api は含めないURLにします
export const sendSidebarChat = async (message, history, topic, viewpoint, content) => {
  // BASE_URL を直接使えば置換処理は不要です
  const res = await fetch(`${BASE_URL}/simple-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      message, 
      history, 
      topic, 
      viewpoint, 
      content 
    }),
  });
  
  if (!res.ok) throw new Error("チャット送信エラー");
  return await res.json();
};

// 6. ユーザー認証（ログイン/登録）
export const authUser = async (type, nickname) => {
  // バックエンドのURL構造に合わせて endpoint を調整
  // main.py で @app.post("/api/users/register") としている場合はこちら
  const endpoint = type === 'register' ? '/users/register' : '/users/login';
  
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: nickname, nickname: nickname })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "認証エラー");
  return data;
};
