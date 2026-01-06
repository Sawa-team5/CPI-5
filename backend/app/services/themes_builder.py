from __future__ import annotations
from typing import Dict, List
from app.services.openai_data_collect_service import CollectedItems, stable_id

from uuid import uuid4
import re

THEME_COLORS = ["#E57373", "#FFD54F", "#81C784"]
OPINION_POSITIVE = ["#EF9A9A", "#A5D6A7", "#81C784", "#FDD835"]  
OPINION_NEUTRAL  = ["#B0BEC5", "#7986CB"]                       
OPINION_NEGATIVE = ["#90CAF9", "#B0BEC5"]  

def _pick_theme_color(theme_id: str) -> str:
    return THEME_COLORS[int(theme_id[-1], 16) % len(THEME_COLORS)]

def _pick_opinion_color(score: int, idx: int) -> str:
    if score > 30:
        palette = OPINION_POSITIVE
    elif score < -30:
        palette = OPINION_NEGATIVE
    else:
        palette = OPINION_NEUTRAL

    return palette[idx % len(palette)]

def _normalize_text(s: str) -> str:
    s = s.strip()
    s = re.sub(r"\s+", " ", s)  # collapse whitespace
    return s

def dedupe_opinions_by_content(opinion_rows: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for op in opinion_rows:
        key = (_normalize_text(op["title"]), _normalize_text(op["body"]))
        if key in seen:
            continue
        seen.add(key)
        out.append(op)
    return out


def build_theme_rows(topic: str, collected: CollectedItems) -> Dict[str, object]:
    theme_id = stable_id("theme", topic)
    theme_color = _pick_theme_color(theme_id)

    theme_row = {"id": theme_id, "title": topic, "color": theme_color}

    seen_ids = set()
    opinion_rows: List[dict] = []

    for idx, item in enumerate(collected.items):
        opinion_id = f"op_{uuid4().hex}"
        if opinion_id in seen_ids:
            continue
        seen_ids.add(opinion_id)

        score = int(item.agreement_score)
        opinion_rows.append({
            "id": f"op_{uuid4().hex}",
            "theme_id": theme_id,
            "title": item.topic_name,
            "body": item.summary,
            "score": score,
            "color": _pick_opinion_color(score, idx),
            "sourceUrl": str(item.url),
        })

    opinion_rows = dedupe_opinions_by_content(opinion_rows)
    return {"theme": theme_row, "opinions": opinion_rows}