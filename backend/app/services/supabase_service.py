from __future__ import annotations
from typing import Any
from app.config import SUPABASE_URL, SUPABASE_KEY
from app.utils.logger import logger

_supabase = None

def enabled() -> bool:
    return _supabase is not None

def client() -> Any:
    if _supabase is None:
        raise RuntimeError("Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY.")
    return _supabase

def init_supabase() -> None:
    global _supabase
    if _supabase is not None:
        return
    if not (SUPABASE_URL and SUPABASE_KEY):
        logger.warning("Supabase env vars not set; running without DB.")
        return
    
    from supabase import create_client
    _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info(f"✓ Supabaseに接続しました: {SUPABASE_URL}")