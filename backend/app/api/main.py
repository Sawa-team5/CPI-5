# backend/app/api/main.py

import uuid
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai

from app.ai_logic import generate_opinions, generate_chat_reply, analyze_position
from app.services.theme_store_service import list_themes_with_opinions, upsert_theme_and_opinions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TopicRequest(BaseModel):
    topic: str

class ChatMessage(BaseModel):
    role: str
    parts: List[str]

class ChatRequest(BaseModel):
    topic: str
    viewpoint: str
    content: str
    history: List[ChatMessage]

class AnalysisRequest(BaseModel):
    topic: str
    history: List[ChatMessage]

class SimpleChatRequest(BaseModel):
    message: str

THEME_COLORS = ["#E57373", "#FFD54F", "#81C784"]

@app.get("/api/themes")
async def api_get_themes():
    try:
        data = list_themes_with_opinions()
        # 最新の順に並べ替えたりする処理が必要ならここで
        return data
    except Exception as e:
        print(f"Fetch error: {e}")
        return {"themes": []}

@app.post("/api/opinions")
async def api_generate_opinions(req: TopicRequest):
    print(f"Generating opinions for: {req.topic}")
    ai_raw_data = generate_opinions(req.topic)
    
    if not ai_raw_data:
        raise HTTPException(status_code=500, detail="AI generation failed")

    theme_id = str(uuid.uuid4())
    
    # ★変更: 色をランダムではなく順番っぽく選ぶ（今回はランダム選択だが候補を絞った）
    theme_color = random.choice(THEME_COLORS)

    theme_data = {
        "id": theme_id,
        "title": req.topic,
        "color": theme_color 
    }

    formatted_opinions = []
    
    # ★変更: 意見の色分けロジック（賛成なら赤系、反対なら青系、中立はテーマ色）
    for item in ai_raw_data:
        viewpoint = item.get("viewpoint", "中立")
        content = item.get("content", "")
        
        # デフォルトはテーマの色
        op_color = theme_color
        
        # 簡易的なキーワード判定で色を変える（フロントエンド班のダミーデータに寄せる）
        if "肯定" in viewpoint or "賛成" in viewpoint or "メリット" in viewpoint:
            op_color = "#EF9A9A" # 薄い赤
        elif "否定" in viewpoint or "反対" in viewpoint or "デメリット" in viewpoint or "懸念" in viewpoint:
            op_color = "#90CAF9" # 薄い青（ダミーデータの fiscal-discipline の色に近い）
        
        formatted_opinions.append({
            "id": str(uuid.uuid4()),
            "theme_id": theme_id,
            "title": viewpoint,
            "body": content,
            "score": 0,
            "color": op_color,
            "sourceUrl": ""
        })

    try:
        upsert_theme_and_opinions(theme_data, formatted_opinions)
    except Exception as e:
        print(f"Database save error: {e}")

    return {
        "themes": [{
            "id": theme_id,
            "title": req.topic,
            "color": theme_color,
            "opinions": formatted_opinions
        }]
    }

# チャット・分析APIはそのまま
@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    history_dicts = [m.dict() for m in req.history]
    result = generate_chat_reply(req.topic, req.viewpoint, req.content, history_dicts)
    return result

@app.post("/api/analyze")
async def api_analyze(req: AnalysisRequest):
    history_dicts = [m.dict() for m in req.history]
    result = analyze_position(req.topic, history_dicts)
    return result

def get_chat_instruction(topic, viewpoint, content, turn_count):
    """
    turn_count を引数に追加し、ターン数ごとに厳密に指示を変えます
    """
    base = f"""
    あなたは、ユーザーの話を引き出し、思考を整理する「壁打ちパートナー」です。
    文脈: テーマ「{topic}」、ユーザーの立場「{viewpoint}」、意見「{content}」
    
    【基本姿勢】
    - ユーザーを論破・否定しない。
    - 質問攻めにせず、会話のキャッチボールをする。
    - **直前と同じ質問や、似たような言い回しは絶対に避けること。**
    - 日本語で回答してください。
    """
    
    # --- Phase 1: 導入 (Turn 1-2) ---
    if turn_count <= 2:
        return base + """
        【指示: 背景の共有】
        「なぜその意見に共感したのですか？」や「具体的な体験はありますか？」と聞き、
        ユーザーの**個人的な背景**を優しく聞いてください。
        """
    
    # --- Phase 2: 視点の転換 (Turn 3-4) ---
    elif turn_count == 3:
        return base + """
        【指示: 感情の想像 (視点転換・前半)】
        ユーザーの話を受け止めた上で、
        「もし、あなたが〇〇（反対の立場や当事者）の立場だったら、**どのような『感情』を抱くと思いますか？**」
        と問いかけ、相手の心境を想像させる質問をしてください。
        """
    elif turn_count == 4:
        return base + """
        【指示: 共存の模索 (視点転換・後半)】
        **注意: 直前で「相手の感情」については既に聞きました。同じ質問は禁止です。**
        
        今回は視点を変えて、
        「では、そのような立場の人がいる中で、**どのようなルールや工夫があれば**、うまくやっていけると思いますか？」
        と、**具体的な解決策や共存のアイデア**について問いかけてください。
        """
    
    # --- Phase 3: 提案と深化 (Turn 5-6) ---
    elif turn_count <= 6:
        return base + """
        【指示: 提案と深化】
        ここからは質問攻めをやめます。
        ユーザーの返答に対して、「**例えば、〇〇という考え方もあるようですが、これについてはどう思いますか？**」
        と、あなたから**具体的な選択肢や新しい視点**を提示して、意見を聞いてください。
        「他にどう思いますか？」という丸投げの質問は禁止です。
        """
    
    # --- Phase 4: クッションとまとめ (Turn 7) ---
    elif turn_count == 7:
        return base + """
        【指示: クッションとまとめ】
        これまでの会話を要約し、「〜という視点は非常に興味深いですね」と感想を伝えてください。
        **まだ終了質問はせず**、会話を綺麗にまとめて、ユーザーに「話してよかった」と思わせてから、
        「ここまでの内容で、思考の整理はできましたでしょうか？（次へ進んでよろしいですか？）」
        と優しく確認してください。
        """
    
    # --- Phase 5: 終了判定 ---
    else:
        return base + """
        【指示: 終了判定】
        ユーザーの返答を見てください。
        1. 「はい」「進む」「大丈夫」などの肯定、または「ない」等の場合:
           - 感謝を述べて会話を締めくくってください。
           - **最後に必ず `[[END]]` を出力してください。**
        2. まだ話したい様子なら:
           - 共感して会話を続け（提案型で）、`[[END]]`は出さないでください。
        """

# 1. リクエスト型に content (意見の本文) を追加
class SimpleChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    topic: Optional[str] = "自由テーマ"
    viewpoint: Optional[str] = "未定" # 賛成・反対など
    content: Optional[str] = "特になし" # ★追加: 見ている意見の本文

# 2. エンドポイントの修正
@app.post("/simple-chat")
async def simple_chat_endpoint(req: SimpleChatRequest):
    try:
        # ターン数の計算
        current_turn = (len(req.history) // 2) + 1
        
        # ★修正: リクエストから受け取ったテーマ情報を渡す
        # ユーザーがまだ何も発言していない(turn=1)等の場合でも、
        # 「見ている意見(req.content)」を文脈としてセットします。
        system_instruction = get_chat_instruction(
            topic=req.topic,
            viewpoint=req.viewpoint,
            content=req.content, 
            turn_count=current_turn
        )

        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        # 会話履歴の変換
        gemini_history = []
        for h in req.history:
            role = "user" if h['sender'] == 'user' else "model"
            if h['sender'] == 'bot': role = "model"
            gemini_history.append({"role": role, "parts": [h['text']]})
            
        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(req.message)
        
        return {"reply": response.text}

    except Exception as e:
        print(f"Chat Error: {e}")
        return {"reply": "エラーが発生しました。"}