import os
import json
import google.generativeai as genai
import re

# APIキーの取得（.envは main.py で読み込まれるのでここでは os.getenv でOK）
API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"

# --- 1. 意見生成 (スコア付き) ---
def generate_opinions(topic: str):
    """
    テーマに基づいた意見、情報源、そしてポジションスコアを生成する
    """
    model = genai.GenerativeModel(MODEL_NAME, generation_config={"response_mime_type": "application/json"})
    
    # ★修正: position_score を追加したプロンプト
    prompt = f"""
    テーマ「{topic}」について、異なる立場の意見を5つ生成してください。
    
    【出力フォーマット】
    以下のJSON形式のリストのみを出力してください。
    
    [
      {{
        "viewpoint": "肯定派", 
        "content": "財源確保のために必要だ...",
        "source_name": "日本経済新聞のコラム",
        "position_score": 80
      }},
      {{
        "viewpoint": "反対派", 
        "content": "生活が苦しくなる...",
        "source_name": "X (旧Twitter) の投稿",
        "position_score": -70
      }}
    ]
    
    【必須条件】
    1. position_score は、その意見が「テーマに対してどれくらい賛成/反対か」を -100（完全反対）〜 100（完全賛成）の数値で決めてください。
       - 0 は完全な中立です。
       - 肯定的な意見はプラスの値（例: 30, 80, 100）
       - 否定的な意見はマイナスの値（例: -30, -80, -100）
    2. source_name は、その意見がいかにも出てきそうな架空の、しかしもっともらしい媒体名を書いてください。
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        
        # Markdownの ```json ... ``` を除去する安全策
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            text = json_match.group(0)
            
        return json.loads(text)
    except Exception as e:
        print(f"Error in opinions: {e}")
        return []

# --- 2. チャット応答 ---
def generate_chat_reply(topic, opinion_title, opinion_body, history):
    """
    チャットの返答を生成する
    history: [{"role": "user", "parts": ["..."]}, ...]
    """
    if not API_KEY:
        return {"reply": "APIキー設定エラー"}

    system_instruction = f"""
    あなたは「{topic}」というテーマにおける「{opinion_title}」という立場の人物として振る舞ってください。
    
    あなたの意見の詳細:
    {opinion_body}
    
    ユーザーはこの意見に対して興味を持ち、議論を求めています。
    短く、対話的に、相手に問いかけるように返答してください。
    """

    model = genai.GenerativeModel(MODEL_NAME, system_instruction=system_instruction)
    
    try:
        # 最後のメッセージ以外を履歴として渡す
        chat = model.start_chat(history=history[:-1])
        # 最後のメッセージを送信
        last_msg = history[-1]["parts"][0]
        response = chat.send_message(last_msg)
        
        return {"reply": response.text}
    except Exception as e:
        print(f"Error in chat: {e}")
        return {"reply": "すみません、うまく思考できませんでした。"}

# --- 3. 座標分析 (今回は使わないかもですが残しておきます) ---
def analyze_position(topic: str, history: list):
    # 必要なら実装
    pass