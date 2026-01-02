from __future__ import annotations
from typing import Any

from app.config import SUPABASE_URL, SUPABASE_KEY

_supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    from supabase import create_client
    _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def enabled() -> bool:
    return _supabase is not None

def client() -> Any:
    if _supabase is None:
        raise RuntimeError("Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY.")
    return _supabase