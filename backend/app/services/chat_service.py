import os
from typing import Dict, Any, Optional

from openai import OpenAI
from app.utils.logger import logger
# CHANGE TOPIC_CARDS_MODEL LATER TO THE CHAT MODEL
from app.config import OPENAI_API_KEY, CHAT_MODEL

class ChatService:
    """
    ChatMode:
    - manages conversation
    - keeps short chat history per session
    - calls LLM with strict instructions
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.model = CHAT_MODEL

        self.sessions: Dict[str, Dict[str, Any]] = {}

    def _get_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "step": 1,
                "themeTitle": None,
                "stanceScore": None,
                "agreedOpinion": None,
                "history": [],
            }
        return self.sessions[session_id]
    
    def _system_prompt(self) -> str:
        return (
            "あなたは内省支援の対話AIです。\n"
            "ユーザーを説得したり、正解を教えたりしてはいけません。\n"
            "共感 → 理由 → 体験 → 整理 → 他の立場 → 内省、を段階的に進めます。\n"
            "です・ます調。短く。質問は1つだけ。"
        )
    
    def _step_instruction(self, step: int) -> str:
        return {
            1: "ユーザーの立場を中立に言語化し、共感する。",
            2: "なぜその意見を持つようになったかを尋ねる。",
            3: "具体的な体験や出来事を1つだけ尋ねる。",
            4: "ユーザーの考えを整理して承認する。",
            5: "異なる立場の存在を穏やかに提示する。",
            6: "テーマの複雑さを短く伝える。",
            7: "他の意見を見ることを提案する。",
            8: "他の意見を見た後の感想を尋ねる。",
        }.get(step, "ユーザーの考えを丁寧に受け止める。")
    
    def _advance_step(self, session: Dict[str, Any]):
        if session["step"] < 8:
            session["step"] += 1

    async def chat(
        self,
        session_id: str,
        message: str,
        theme_title: Optional[str],
        stance_score: Optional[str],
        agreed_opinion: Optional[str],
    ) -> Dict[str, Any]:
        s = self._get_session(session_id)

        if theme_title:
            s["themeTitle"] = theme_title
        if stance_score is not None:
            s["stanceScore"] = stance_score
        if agreed_opinion:
            s["agreedOpinion"] = agreed_opinion

        step = s["step"]

        messages = [
            {"role": "system", "content": self._system_prompt()},
            {
                "role": "system",
                "content": (
                    f"現在のステップ: {step}\n"
                    f"このターンの目的: {self._step_instruction(step)}\n"
                    f"テーマ: {s['themeTitle']}\n"
                    f"ユーザー立場スコア: {s['stanceScore']}\n"
                    f"ユーザーの意見: {s['agreedOpinion']}"
                ),
            },
        ]

        if message.strip():
            messages.append({"role": "user", "content": message})

        try:
            res = self.client.responses.create(
                model=self.model,
                input=messages,
            )

            reply = (res.output_text or "").strip()
            if not reply:
                reply = "なるほど。もう少し教えてもらえますか？"

            self._advance_step(s)

            logger.info(f"[ChatMode] session={session_id} step={step}->{s['step']}")

            return {
                "reply": reply,
                "step": s["step"],
            }

        except Exception as e:
            logger.error(f"ChatService error: {str(e)}")
            raise

chat_service = ChatService()
