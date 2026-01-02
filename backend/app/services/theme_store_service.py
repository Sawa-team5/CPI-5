from __future__ import annotations
from typing import List, Dict, Any

from app.services.supabase_service import enabled, client

def list_themes_with_opinions() -> Dict[str, Any]:
    """
    :return: Returns list of themes in compatible format with frontend-app/dummyData.json
    :rtype: Dict[str, Any]
    """

    if not enabled():
        return {"themes": []}
    
    sb = client()

    # Fetch themes from supabase
    themes_res = sb.table("themes").select("id,title,color").execute()
    themes = themes_res.data or []

    if not themes:
        return {"themes": []}
    
    # Fetch opinions from supabase
    opinions_res = sb.table("opinions").select("id,theme_id,title,body,score,color,source_url").execute()
    opinions = opinions_res.data or []

    by_theme = Dict[str, List[dict]] = {}
    for op in opinions:
        by_theme.setdefault(op["theme_id"], []).append({
            "id": op["id"],
            "title": op["title"],
            "body": op["body"],
            "score": op["score"],
            "color": op["color"],
            "source_url": op["source_url"]
        })

    out = []
    for t in themes:
        out.append({
            "id": t["id"],
            "title": t["title"],
            "color": t["color"],
            "opinions": by_theme.get(t["id"], [])
        })

    return {"themes": out}

def theme_exists(theme_id: str) -> bool:
    if not enabled():
        return False
    sb = client()
    res = sb.table("themes").select("id").eq("id", theme_id).limit(1).execute()
    return bool(res.data)

def upsert_theme_and_opinions(theme: dict, opinions: list[dict]) -> None:
    """
    :param theme: {id,title,color}
    :type theme: dict
    :param opinions: list of {id, theme_id, title, body, score, color, source_url}
    :type opinions: list[dict]
    """

    if not enabled():
        raise RuntimeError("Supabase not configured")
    
    sb = client()

    sb.table("themes").upsert(theme).execute()

    if opinions:
        sb.table("opinions").upsert(opinions).execute()