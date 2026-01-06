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

    by_theme: Dict[str, List[dict]] = {}
    for op in opinions:
        by_theme.setdefault(op["theme_id"], []).append({
            "id": op["id"],
            "title": op["title"],
            "body": op["body"],
            "score": op["score"],
            "color": op["color"],
            "sourceUrl": op["source_url"]
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
    :param opinions: list of {id, theme_id, title, body, score, color, sourceUrl}
    :type opinions: list[dict]
    """

    if not enabled():
        raise RuntimeError("Supabase not configured")
    
    sb = client()

    sb.table("themes").upsert(theme).execute()

    if opinions:
        db_ops = []
        for op in opinions:
            op2 = dict(op)
            if "sourceUrl" in op2:
                op2["source_url"] = op2.pop("sourceUrl")
            db_ops.append(op2)

        sb.table("opinions").upsert(db_ops).execute()

# DELETE AFTER TESTING
def insert_opinions_only(opinion_rows):
    if not enabled():
        raise RuntimeError("Supabase not enabled.")
    sb = client()
    if opinion_rows:
        db_ops = []
        for op in opinion_rows:
            op2 = dict(op)
            if "sourceUrl" in op2:
                op2["source_url"] = op2.pop("sourceUrl")
            db_ops.append(op2)

        res = sb.table("opinions").insert(db_ops).execute()
        if getattr(res, "error", None):
            raise RuntimeError(f"opinions insert failed: {res.error}")
        
def delete_opinions_for_theme(theme_id: str) -> int:
    """
    Delete all opinions for a given theme_id.
    Returns the number of deleted rows (best-effort; depends on client response).
    """
    if not enabled():
        raise RuntimeError("Supabase not enabled. Set SUPABASE_URL and SUPABASE_KEY.")

    sb = client()
    res = sb.table("opinions").delete().eq("theme_id", theme_id).execute()

    err = getattr(res, "error", None)
    if err:
        raise RuntimeError(f"opinions delete failed: {err}")

    # Some supabase-py versions return deleted rows in res.data; some return [].
    data = getattr(res, "data", None) or []
    return len(data)