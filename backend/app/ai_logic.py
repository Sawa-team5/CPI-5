# backend/app/ai_logic.py
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from .prompts import get_opinion_prompt, get_chat_instruction, get_positioning_prompt

# .envの読み込み
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=API_KEY)

MODEL_NAME = "models/gemini-2.5-flash-lite"

# --- 1. 意見生成 ---
def generate_opinions(topic: str):
    model = genai.GenerativeModel(MODEL_NAME, generation_config={"response_mime_type": "application/json"})
    prompt = get_opinion_prompt(topic)
    
    try:
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in opinions: {e}")
        return [] # エラー時は空リスト

# --- 2. チャット応答 ---
def generate_chat_reply(topic: str, viewpoint: str, content: str, history: list):
    """
    history: [{"role": "user", "parts": ["..."]}, ...] の形式を想定
    """
    model = genai.GenerativeModel(MODEL_NAME)
    
    # ターン数の計算（ユーザーの発言数 + 今回の入力分1）
    user_turns = len([m for m in history if m["role"] == "user"])
    current_turn = user_turns + 1
    
    # 最新のユーザー入力（今回の発言）を取得
    if history and history[-1]["role"] == "user":
        last_user_message = history[-1]["parts"][0]
    else:
        last_user_message = "" # 初回起動時など

    # プロンプト作成
    system_instruction = get_chat_instruction(topic, viewpoint, content, current_turn)
    full_prompt = f"{system_instruction}\n\nUser: {last_user_message}"
    
    # 過去の履歴をAPI用の形式に変換（今回の発言はプロンプトに含めたので除外）
    past_history = history[:-1] if history else []

    try:
        # チャットセッション開始
        chat = model.start_chat(history=past_history)
        response = chat.send_message(full_prompt)
        ai_text = response.text
        
        # 終了判定
        is_finished = False
        if "[[END]]" in ai_text:
            is_finished = True
            ai_text = ai_text.replace("[[END]]", "").strip()
            
        return {
            "reply": ai_text,
            "phase": f"Turn {current_turn}", # デバッグ用にターン数を返す
            "is_finished": is_finished
        }
    except Exception as e:
        return {"reply": "エラーが発生しました。", "is_finished": False}

# --- 3. 座標分析 ---
def analyze_position(topic: str, history: list):
    model = genai.GenerativeModel(MODEL_NAME, generation_config={"response_mime_type": "application/json"})
    
    # ログをテキスト化
    history_text = ""
    for entry in history:
        role = "User" if entry["role"] == "user" else "AI"
        content = entry["parts"][0]
        history_text += f"{role}: {content}\n"

    prompt = get_positioning_prompt(topic, history_text)
    
    try:
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in analysis: {e}")
        # デフォルト値を返す
        return {"x": 0, "y": 0, "tags": [], "summary": "分析失敗"}
    