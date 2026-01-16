// src/api_client.js

// PythonサーバーのURL (FastAPI)
const BASE_URL = "https://humble-space-goldfish-qjjw9gv45qpc9jgr-8000.app.github.dev";
const API_BASE_URL = `${BASE_URL}/api`;

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

// 3. チャット送信 (ChatModeで使う用)
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
// ※ main.py で @app.post("/simple-chat") と定義したので、/api は含めないURLにします
export const sendSidebarChat = async (message, history, topic, viewpoint, content) => {
  // ベースURLの http://localhost:8000/api から /api を取り除いてルートにする
  const rootUrl = API_BASE_URL.replace('/api', ''); 
  
  const res = await fetch(`${rootUrl}/simple-chat`, {
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

// src/api_client.js の一番下に追加

// 4. ユーザー認証（ログイン/登録）
export const authUser = async (type, nickname) => {
  const endpoint = type === 'register' ? '/users/register' : '/users/login';
  
  // ★ここで API_BASE_URL (https://...app.github.dev/api) を使うので、URLがズレない！
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: nickname, nickname: nickname }) // 便宜上usernameにもnicknameを入れる
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "認証エラー");
  return data;
};