// src/api_client.js

// PythonサーバーのURL (FastAPI)
const API_BASE_URL = "http://localhost:8000/api";

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