from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .db import engine, db_connectivity_check
from .routers import backtest, districts, methodology, predictions, assistant

app = FastAPI(
    title="EpiWatch API",
    version="0.3.0",
    description="Multi-disease outbreak prediction backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(districts.router)
app.include_router(predictions.router)
app.include_router(backtest.router)
app.include_router(methodology.router)
app.include_router(assistant.router)


@app.get("/health")
def health():
    try:
        check = db_connectivity_check()
        return {"status": "ok", "database": check, "message": "DB connectivity confirmed via SELECT 1"}
    except Exception as e:
        return {"status": "error", "database": {"ok": False, "error": str(e)}}


@app.get("/")
def root():
    return {"service": "EpiWatch API", "docs": "/docs", "health": "/health"}
