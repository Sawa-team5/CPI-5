from __future__ import annotations
from typing import Dict, List
from app.services.openai_data_collect_service import CollectedItems, stable_id

from uuid import uuid4
import re
import hashlib

THEME_COLORS = [
    "#81C784",  # green
    "#FFD54F",  # yellow
    "#64B5F6",  # blue
    "#BA68C8",  # purple
    "#FF8A65",  # orange
    "#4DB6AC",  # teal
    "#A1887F",  # brown
    "#90A4AE",  # blue gray
]

NEG_COLOR = "#EF5350"  # 赤（-100）
NEU_COLOR = "#FFD54F"  # 黄（0）
POS_COLOR = "#66BB6A"  # 緑（+100）

def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))

def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)

def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return "#{:02X}{:02X}{:02X}".format(r, g, b)

def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t

def _lerp_color(c1: str, c2: str, t: float) -> str:
    r1, g1, b1 = _hex_to_rgb(c1)
    r2, g2, b2 = _hex_to_rgb(c2)
    r = int(round(_lerp(r1, r2, t)))
    g = int(round(_lerp(g1, g2, t)))
    b = int(round(_lerp(b1, b2, t)))
    return _rgb_to_hex(r, g, b)

def opinion_color_from_score(score: int) -> str:
    s = _clamp(float(score), -100.0, 100.0)

    if s <= 0:
        # -100..0 を 赤→黄 に補間
        t = (s + 100.0) / 100.0   # -100=>0, 0=>1
        return _lerp_color(NEG_COLOR, NEU_COLOR, t)
    else:
        # 0..100 を 黄→緑 に補間
        t = s / 100.0             # 0=>0, 100=>1
        return _lerp_color(NEU_COLOR, POS_COLOR, t)

def _hash_index(key: str, n: int) -> int:
    h = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return int(h[:8], 16) % n

def _pick_theme_color(theme_id: str) -> str:
    return THEME_COLORS[_hash_index(theme_id, len(THEME_COLORS))]

def _normalize_text(s: str) -> str:
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
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

    opinion_rows: List[dict] = []

    for item in collected.items:
        op_id = f"op_{uuid4().hex}"
        score = int(item.agreement_score)

        opinion_rows.append({
            "id": op_id, 
            "theme_id": theme_id,
            "title": item.topic_name,
            "body": item.summary,
            "score": score,
            "color": opinion_color_from_score(score),
            "sourceUrl": str(item.url),
        })

    opinion_rows = dedupe_opinions_by_content(opinion_rows)
    return {"theme": theme_row, "opinions": opinion_rows}