from fastapi import FastAPI
from app.api import api_router

app = FastAPI(title="Kaleidoscope Backend")

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "backend running!"}