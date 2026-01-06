from __future__ import annotations

import json
import time
import hashlib
from typing import Optional, List, Tuple
from urllib.parse import urlparse
from collections import Counter
from dataclasses import dataclass
import re

from pydantic import BaseModel, Field, HttpUrl, ValidationError
from openai import OpenAI

from app.config import OPENAI_API_KEY, TOPIC_CARDS_MODEL
from app.services.diversity_pick import pick_diverse_items

class CollectedItem(BaseModel):
    topic_name: str = Field(max_length=15)
    summary: str = Field(max_length=100)
    url: HttpUrl
    agreement_score: int = Field(ge=-100, le=100)

class CollectedItems(BaseModel):
    items: List[CollectedItem]

@dataclass(frozen=True)
class ThemeProfile:
    scoring_target: str
    viewpoint_examples: Optional[List[str]] = None
    force_positions: Optional[List[str]] = None

def _normalize_topic_key(s: str) -> str:
    # 入力ゆれ（全角/半角スペース等）に強くする
    s = s.strip()
    s = re.sub(r"\s+", "", s)
    return s

THEME_PROFILES: dict[str, ThemeProfile] = {
    _normalize_topic_key("熊の駆除"): ThemeProfile(
        scoring_target="『熊の駆除（捕獲）を拡大すべき』に賛成=+100、反対=-100",
        viewpoint_examples=[
            "人身被害・住民の安全",
            "農作物被害・補償",
            "生態系・保護・共存",
            "捕獲の担い手（猟友会）・安全・コスト",
            "再発防止（電気柵・餌管理・監視）",
            "法制度・運用（捕獲基準、自治体対応）",
        ],
    ),
    _normalize_topic_key("高市政権"): ThemeProfile(
        scoring_target="『高市政権は日本にとって望ましい』に賛成=+100、反対=-100",
        viewpoint_examples=[
            "経済政策（成長・財政・インフレ）",
            "安全保障・外交",
            "エネルギー政策（原発・再エネ）",
            "社会政策（教育・少子化）",
            "政治姿勢（統治、説明責任、分断）",
            "憲法・法制度の方向性",
        ],
    ),
    _normalize_topic_key("トランプ政権"): ThemeProfile(
        scoring_target="『トランプ政権（再登場含む）の政策・影響は総合的にプラスである』に賛成=+100、反対=-100",
        viewpoint_examples=[
            "経済（雇用・減税・関税）",
            "移民・国境政策",
            "外交・同盟（NATO、対中、対ロ）",
            "司法・民主主義（制度への影響）",
            "気候・エネルギー政策",
            "社会の分断・治安",
        ],
        force_positions=[
            "肯定・支持の立場（２件）",
            "批判・否定の立場（２件）",
            "中立・評価が分かれる立場（２件）",
        ],
    ),
}

TOPIC_CARDS_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "minItems": 3,
            "maxItems": 8,
            "items": {
                "type": "object",
                "properties": {
                    "topic_name": {"type": "string", "maxLength": 15},
                    "summary": {"type": "string", "maxLength": 100},
                    "url": {"type": "string"},
                    "agreement_score": {
                        "type": "integer",
                        "minimum": -100,
                        "maximum": 100
                    },
                },
                "required": ["topic_name", "summary", "url", "agreement_score"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["items"],
    "additionalProperties": False,
}

def stable_id(prefix: str, s: str) -> str:
    h = hashlib.sha1(s.encode("utf-8")).hexdigest()[:10]
    return f"{prefix}_{h}"

def _domain(u: str) -> str:
    d = urlparse(u).netloc.lower()
    if d.startswith("www."):
        d = d[4:]
    return d

def _build_prompt(
    topic: str,
    max_items: int,
    theme_statement: str | None,
    min_sources: int,
    max_per_url: int,
) -> str:
    key = _normalize_topic_key(topic)
    profile = THEME_PROFILES.get(key)

    scoring_target = (
        theme_statement
        or (profile.scoring_target if profile else None)
        or f"『{topic}』に対して肯定的=+100、否定的=-100"
    )

    viewpoints_block = ""
    if profile and profile.viewpoint_examples:
        bullets = "\n".join([f"- {v}" for v in profile.viewpoint_examples])
        viewpoints_block = f"\n# 論点リスト（例）\n{bullets}\n"

    force_block = ""
    if profile and profile.force_positions:
        bullets = "\n".join([f"- {p}" for p in profile.force_positions])
        force_block = f"""
        重要（必須）：
        以下の立場を必ずすべて含めること。
        記事数が少ない場合でも、対応する論点を探し、必ず生成すること。

        {bullets}

        agreement_score の割り当て：
        - 肯定・支持： +40〜+90
        - 中立・評価が分かれる： -10〜+10
        - 批判・否定： -40〜-90
        """


    return f"""
        あなたはニュース調査アシスタントです。Web検索を使い、記事に基づいて items を作成してください。
        出力は **JSONのみ**（説明文は禁止）。

        # 対象トピック
        {topic}

        # 件数
        {max_items}件

        # agreement_score の基準
        「{scoring_target}」

        # ハード制約（必ず守る）
        - URLは実在する記事URL（検索で見つかったもののみ）
        - topic_name:
        記事が扱う具体的な論点・観点を表す短い日本語フレーズ。
        「賛成」「反対」「中立」など立場ラベルは禁止。
        - topic_name: 15字以内
        - summary: 100字以内（日本語、記事の要点、「である調」の断定文にする）
        - agreement_score: -100〜100 の整数
        - 異なる立場を必ず含める：
        - 強い賛成（+60〜+90）を最低1件
        - 強い反対（-60〜-30）を最低1件
        - 中立（-20〜+20）を最低1件

        # 多様性（できる限り守る）
        - 可能な限り異なる媒体（ドメイン）から集める（最低 {min_sources} 媒体を目標）
        - 同一URLから作る item は最大 {max_per_url} 件まで
        - それぞれ「論点」が被らないようにする（可能なら違う観点を選ぶ）

        {viewpoints_block}
        {force_block}
        """.strip()



def collect_topic_cards(topic: str, max_items: int = 8, theme_statement: Optional[str] = None, min_sources: int = 4, max_per_url: int = 2) -> CollectedItems:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set")
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    prompt = _build_prompt(topic, max_items, theme_statement, min_sources=min_sources, max_per_url=max_per_url)

    last_err: Exception | None = None
    for attempt in range(1, 4):
        try:
            resp = client.responses.create(
                model=TOPIC_CARDS_MODEL,
                input=prompt,
                tools=[{"type": "web_search"}],
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "topic_cards",
                        "schema": TOPIC_CARDS_JSON_SCHEMA,
                        "strict": True,
                    }
                },
            )
            data = json.loads(resp.output_text)
            
            parsed = CollectedItems(**data)

            # filtered, domain_count, kept_count = _postprocess_items(
            #     parsed,
            #     min_sources=min_sources,
            #     max_per_url=max_per_url,
            # )

            picked, meta = pick_diverse_items(parsed.items, target_n=6)

            print("[diversity_pick]", meta)

            if len(picked) < 4:
                # extremely rare; treat as failure
                raise RuntimeError("Not enough diverse items after selection")

            return CollectedItems(items=picked)

            # Quality gate: if not enough unique domains, trigger warning
            # if domain_count < min_sources:
            #     print(f"[WARN] Not enough unique sources: {domain_count} < {min_sources} (kept={kept_count})")
            #     return filtered

            # # Also ensure we kept enough items (optional)
            # if len(filtered.items) < 3:
            #     raise RuntimeError(f"Too few items after filtering: {len(filtered.items)}")

            # return filtered

        except (json.JSONDecodeError, ValidationError) as e:
            last_err = e
        except Exception as e:
            last_err = e

        time.sleep(0.6 * attempt)

    raise RuntimeError(f"AI collection failed after retries: {last_err}")