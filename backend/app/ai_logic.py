# backend/app/ai_logic.py
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from .prompts import get_chat_instruction, get_positioning_prompt
# get_opinion_prompt はこのファイル内で直接定義するため import から除外、または未使用でもOK

# .envの読み込み
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=API_KEY)

# Gemini 1.5 Flash (または 2.0 Flash) を指定
MODEL_NAME = "models/gemini-2.5-flash" 
# ※ もし 2.5-flash-lite が使える環境ならそのままでOKですが、
# 一般的には 1.5-flash が安定しています。エラーが出る場合は書き換えてください。

# --- 1. 意見生成 ---
def generate_opinions(topic: str):
    """
    テーマに基づいた意見と、それっぽい情報源(source_name)を生成する
    """
    # response_mime_type="application/json" でJSON出力を強制
    model = genai.GenerativeModel(MODEL_NAME, generation_config={"response_mime_type": "application/json"})
    
    # ★プロンプト定義: source_name を含めるように指示
    prompt = f"""
    テーマ「{topic}」について、異なる立場の意見を5つ生成してください。
    
    【出力フォーマット】
    以下のJSON形式のリストのみを出力してください。
    必ず「viewpoint（立場名）」「content（意見内容）」「source_name（情報源の名前）」の3つを含めてください。

    [
      {{
        "viewpoint": "肯定派", 
        "content": "財源確保のために必要だ...",
        "source_name": "日本経済新聞のコラム"
      }},
      {{
        "viewpoint": "反対派", 
        "content": "生活が苦しくなる...",
        "source_name": "X (旧Twitter) の投稿"
      }}
    ]
    
    【条件】
    - source_name は「〇〇新聞」「XX省の統計」「Xでの話題」「〇〇大学の研究」など、その意見がいかにも出てきそうな媒体名を想像して書いてください。
    """
    
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

    # プロンプト作成 (prompts.py から取得)
    system_instruction = get_chat_instruction(topic, viewpoint, content, current_turn)
    
    # チャット履歴をAPI用の形式に変換
    # Gemini APIのhistoryは {"role": "user"|"model", "parts": ["text"]} のリスト
    gemini_history = []
    
    # 今回の最新メッセージ以外の履歴を作成
    past_history = history[:-1] if history else []
    
    for h in past_history:
        role = "user" if h["role"] == "user" else "model"
        gemini_history.append({"role": role, "parts": h["parts"]})

    try:
        # チャットセッション開始 (system_instructionを設定)
        model = genai.GenerativeModel(MODEL_NAME, system_instruction=system_instruction)
        chat = model.start_chat(history=gemini_history)
        
        # メッセージ送信
        response = chat.send_message(last_user_message)
        ai_text = response.text
        
        # 終了判定 ([[END]]タグがあるか)
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
        print(f"Error in chat: {e}")
        return {"reply": "申し訳ありません。エラーが発生しました。", "is_finished": False}

# --- 3. 座標分析 ---
def analyze_position(topic: str, history: list):
    # 分析もJSONモードで行う
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
    