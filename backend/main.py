"""
EpiWatch Backend — Main entrypoint launcher.
Run: uvicorn backend.main:app --reload
Or:  python backend/main.py
"""
import uvicorn

# Re-export the FastAPI app instance from the app package
from backend.app.main import app  # noqa: F401

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
