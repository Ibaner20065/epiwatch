from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, models
from .db import engine, db_connectivity_check
from .routers import backtest, districts, methodology, predictions, assistant, news, precautions, benefits, forecast


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="EpiWatch API",
    version="0.3.0",
    description="Multi-disease outbreak prediction backend",
    lifespan=lifespan,
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
app.include_router(forecast.router)
app.include_router(methodology.router)
app.include_router(assistant.router)
app.include_router(news.router)
app.include_router(precautions.router)
app.include_router(benefits.router)


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
