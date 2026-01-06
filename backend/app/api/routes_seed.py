from fastapi import APIRouter, HTTPException
from app.schemas.seed import SeedThemeRequest
from app.services.openai_data_collect_service import collect_topic_cards, stable_id
from app.services.themes_builder import build_theme_rows
from app.services.theme_store_service import theme_exists, upsert_theme_and_opinions, insert_opinions_only, delete_opinions_for_theme

router = APIRouter()

@router.post("/seed-preview")
def seed_preview(req: SeedThemeRequest):
    """
    Runs AI collection ONCE and returns the raw items.
    Does NOT write to Supabase.
    """

    collected = collect_topic_cards(
        topic=req.topic,
        max_items=req.max_items,
        theme_statement=req.theme_statement,
        min_sources=4, 
        max_per_url=2
    )
    return collected.model_dump()

@router.post("/seed-theme")
def seed_theme(req: SeedThemeRequest):
    """
    One-time seed.
    If the theme already exists, return 409 (no regeneration).
    """

    theme_id = stable_id("theme", req.topic)

    if theme_exists(theme_id):
        raise HTTPException(
            status_code=409,
            detail="Theme already exists; regeneration disabled."
        )

    collected = collect_topic_cards(
        topic=req.topic,
        max_items=req.max_items,
        theme_statement=req.theme_statement,
    )
    rows = build_theme_rows(req.topic, collected)
    upsert_theme_and_opinions(rows["theme"], rows["opinions"])

    return {"ok": True, "themeId": rows["theme"]["id"], "opinionsCount": len(rows["opinions"])}

# DELETE AFTER TESTING
@router.post("/seed-opinions")
def seed_opinions(req: SeedThemeRequest):
    theme_id = stable_id("theme", req.topic)

    if not theme_exists(theme_id):
        raise HTTPException(status_code=404, detail="Theme does not exist yet. Run seed-theme first.")

    collected = collect_topic_cards(req.topic, req.max_items, req.theme_statement, min_sources=4, max_per_url=2)
    rows = build_theme_rows(req.topic, collected)

    # Force opinions to attach to the existing theme_id
    for op in rows["opinions"]:
        op["theme_id"] = theme_id


    # ✅ DEBUG (Step 3): check for duplicate IDs inside this batch
    ids = [op["id"] for op in rows["opinions"]]
    print("opinionsCount =", len(ids))
    print("uniqueIds     =", len(set(ids)))

    if len(ids) != len(set(ids)):
        seen = set()
        dupes = []
        for i in ids:
            if i in seen:
                dupes.append(i)
            else:
                seen.add(i)
        print("duplicate ids:", dupes[:10])

    deleted = delete_opinions_for_theme(theme_id)
    insert_opinions_only(rows["opinions"])

    return {
        "ok": True,
        "themeId": theme_id,
        "deletedOpinions": deleted,
        "opinionsCount": len(rows["opinions"]),
    }