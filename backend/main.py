"""Segregated FastAPI Backend Entrypoint for LADIP.

Run with:
    uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
"""
from src.api import app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
