from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, models, models_livestock
from .db import engine, db_connectivity_check
from .routers import backtest, districts, methodology, predictions, assistant, news, precautions, benefits, forecast, oa as oa_router
from .routers import livestock_reports, livestock_records, livestock_alerts, livestock_lab, livestock_dashboard, livestock_ivr, livestock_geo, livestock_dataful

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tolerate an unreachable database at startup so the app (and its offline
    # static-fallback routes) still serves when the backing store is down.
    try:
        models.Base.metadata.create_all(bind=engine)
        models_livestock.Base.metadata.create_all(bind=engine)
    except Exception as exc:  # pragma: no cover - network/db dependent
        print(f"[startup] DB metadata create skipped: {exc}")
    yield


app = FastAPI(
    title="EpiWatch + PashuRaksha API",
    version="0.4.0",
    description="Multi-disease outbreak prediction + Animal health surveillance backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
app.include_router(oa_router.router)

# ── PashuRaksha (Livestock Surveillance) ──────────────────────────
app.include_router(livestock_reports.router)
app.include_router(livestock_records.router)
app.include_router(livestock_alerts.router)
app.include_router(livestock_lab.router)
app.include_router(livestock_dashboard.router)
app.include_router(livestock_ivr.router)
app.include_router(livestock_geo.router)
app.include_router(livestock_dataful.router)


@app.get("/health")
def health():
    try:
        check = db_connectivity_check()
        return {"status": "ok", "database": check, "message": "DB connectivity confirmed via SELECT 1"}
    except Exception as e:
        return {"status": "error", "database": {"ok": False, "error": str(e)}}


@app.get("/")
def root():
    return {
        "service": "EpiWatch + PashuRaksha API",
        "version": "0.4.0",
        "modules": {
            "epiwatch": "Multi-disease outbreak prediction (Human)",
            "pashuraksha": "Animal health surveillance (Livestock — Maharashtra)",
        },
        "docs": "/docs",
        "health": "/health",
    }
