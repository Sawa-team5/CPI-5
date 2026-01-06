from __future__ import annotations
from typing import List, Tuple
from urllib.parse import urlparse
import re

def _domain(url: str) -> str:
    d = urlparse(url).netloc.lower()
    return d[4:] if d.startswith("www.") else d

def _norm(s: str) -> str:
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    return s

def _stance_bucket(score: int) -> str:
    if score >= 60:
        return "pro"
    if score <= -30:
        return "con"
    if -10 <= score <= 10:
        return "neutral"
    return "other"

def pick_diverse_items(items: List, target_n: int = 6) -> Tuple[List, dict]:
    """
    Generic (topic-agnostic) selection:
    - prefers different stance buckets (pro/con/neutral)
    - prefers different domains
    - dedupes identical title+summary
    """
    # 1) dedupe identical content
    seen = set()
    uniq = []
    for it in items:
        key = (_norm(getattr(it, "topic_name", "")), _norm(getattr(it, "summary", "")))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(it)

    # 2) annotate
    annotated = []
    for it in uniq:
        url = str(getattr(it, "url"))
        score = int(getattr(it, "agreement_score"))
        annotated.append((it, _domain(url), _stance_bucket(score)))

    # 3) greedy selection
    picked = []
    used_domains = set()
    bucket_counts = {"pro": 0, "con": 0, "neutral": 0, "other": 0}

    def cand_score(dom: str, b: str) -> int:
        s = 0
        if bucket_counts.get(b, 0) == 0:
            s += 4  # fill missing stance first
        if dom not in used_domains:
            s += 3  # new domain
        if b == "other":
            s -= 1  # slight penalty
        return s

    remaining = annotated[:]
    while remaining and len(picked) < target_n:
        remaining.sort(key=lambda x: cand_score(x[1], x[2]), reverse=True)
        it, dom, b = remaining.pop(0)
        picked.append(it)
        used_domains.add(dom)
        bucket_counts[b] = bucket_counts.get(b, 0) + 1

    meta = {
        "unique_domains": len(used_domains),
        "bucket_counts": bucket_counts,
        "kept": len(picked),
        "candidates": len(items),
    }
    return picked, meta
