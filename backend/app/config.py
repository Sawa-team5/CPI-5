import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

TOPIC_CARDS_MODEL = os.getenv("TOPIC_CARDS_MODEL", "gpt-4o-mini")
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")