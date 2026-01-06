from __future__ import annotations

import json
import time
import hashlib
from typing import Optional, List, Tuple
from urllib.parse import urlparse
from collections import Counter

from pydantic import BaseModel, Field, HttpUrl, ValidationError
from openai import OpenAI

from app.config import OPENAI_API_KEY, TOPIC_CARDS_MODEL
from app.services.diversity_pick import pick_diverse_items

class CollectedItem(BaseModel):
    topic_name: str = Field(max_length=10)
    summary: str = Field(max_length=100)
    url: HttpUrl
    agreement_score: int = Field(ge=-100, le=100)

class CollectedItems(BaseModel):
    items: List[CollectedItem]

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
                    "topic_name": {"type": "string", "maxLength": 10},
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

def _postprocess_items(items: CollectedItems, min_sources: int, max_per_url: int) -> Tuple[CollectedItems, int, int]:
    """
    Returns: (filtered_items, unique_domain_count, kept_count)
    - caps same-URL items to max_per_url
    - counts unique domains after filtering
    """
    url_counts = Counter()
    filtered: List[CollectedItem] = []

    for it in items.items:
        u = str(it.url)
        if url_counts[u] >= max_per_url:
            continue
        url_counts[u] += 1
        filtered.append(it)

    filtered_items = CollectedItems(items=filtered)
    domains = {_domain(str(it.url)) for it in filtered_items.items}
    return filtered_items, len(domains), len(filtered_items.items)

def _build_prompt(topic: str, max_items: int, theme_statement: Optional[str], min_sources: int, max_per_url: int) -> str:
    scoring_target = theme_statement or f"『{topic}』に肯定的か否定的か（肯定=+100, 否定=-100）"

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
        - topic_name: 10字以内（主張ラベル）
        - summary: 100字以内（日本語、記事の要点）
        - agreement_score: -100〜100 の整数
        - 異なる立場を必ず含める：
        - 強い賛成（+60〜+90）を最低1件
        - 強い反対（-60〜-30）を最低1件
        - 中立（-10〜+10）を最低1件

        # 多様性（できる限り守る）
        - 可能な限り異なる媒体（ドメイン）から集める（最低 {min_sources} 媒体を目標）
        - 同一URLから作る item は最大 {max_per_url} 件まで
        - 8件それぞれ「論点」が被らないようにする（下の論点リストからできるだけ違うものを選ぶ）

        # 論点リスト（例）
        - 人身・農作物被害／住民安全
        - 生態系・保護・共存
        - 猟友会・担い手不足・費用
        - 法制度・捕獲基準・運用の課題
        - 市街地対策（電気柵、監視カメラ、警報、餌資源管理）
        - 気候変動・餌不足・出没要因分析

        # 重要：スコアの対応
        - “積極的に駆除すべき” を支持するほどプラス
        - “駆除拡大を抑制/共存/保護を優先” はマイナス
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