from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import engine
from ..models import ForecastRun
from ..schemas import ForecastRunSchema

router = APIRouter(prefix="/forecast", tags=["Forecast"])


def get_db():
    with Session(engine) as session:
        yield session


@router.get("/runs", response_model=list[ForecastRunSchema])
def list_forecast_runs(
    district_id: str | None = Query(None),
    disease: str | None = Query(None),
    horizon_type: str | None = Query(None, pattern="^(backtest|live_forecast)$"),
    db: Session = Depends(get_db),
):
    """List stored backtest / live forecast runs, optionally filtered.

    Supports the honest-framing UI: clients can pull both the validated
    backtest windows (horizon_type=backtest) and the unresolved live forecast
    (horizon_type=live_forecast) for the same district/disease and render a
    visual break between them.
    """
    query = db.query(ForecastRun)
    if district_id:
        query = query.filter(ForecastRun.district_id == district_id.upper())
    if disease:
        query = query.filter(ForecastRun.disease == disease.lower())
    if horizon_type:
        query = query.filter(ForecastRun.horizon_type == horizon_type)

    runs = query.order_by(ForecastRun.computed_at.desc()).all()
    if not runs:
        raise HTTPException(status_code=404, detail="No forecast runs match the given filters.")
    return runs


@router.get("/runs/{run_id}", response_model=ForecastRunSchema)
def get_forecast_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ForecastRun).filter(ForecastRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Forecast run '{run_id}' not found")
    return run
