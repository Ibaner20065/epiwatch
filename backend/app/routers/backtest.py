from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

from ..db import engine
from ..models import BacktestEvent, BacktestRun
from ..schemas import BacktestEventSchema

router = APIRouter(prefix="/backtest", tags=["Backtest"])

LEAD_WINDOW_WEEKS = 8
POST_PEAK_WEEKS = 4
PEAK_DETECT_WINDOW_WEEKS = 26
MIN_WEEKS_REQUIRED = 52

BASE_FEATS = ["sin_week", "cos_week", "cases_lag1", "cases_lag2", "cases_lag4"]
CLIMATE_FEATS = ["rainfall_mm", "temp_max_c", "humidity_pct", "rainfall_lag2", "temp_max_lag1", "humidity_lag1"]

DISEASE_LABELS = {
    "dengue": "Dengue",
    "malaria": "Malaria",
    "add": "Acute Diarrheal Disease",
}


def get_db():
    with Session(engine) as session:
        yield session


def _fetch_series(district_id: str, disease: str) -> pd.DataFrame:
    """Load weekly cases + climate for a district/disease from the DB."""
    query = text("""
        SELECT cd.week_start, cd.cases,
               cl.rainfall_mm, cl.temp_max_c, cl.humidity_pct
        FROM case_data cd
        LEFT JOIN climate_data cl
          ON cl.district_id = cd.district_id AND cl.week_start = cd.week_start
        WHERE cd.district_id = :d AND cd.disease = :dis
        ORDER BY cd.week_start
    """)
    with engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"d": district_id.upper(), "dis": disease.lower()})

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No historical case data for {district_id.upper()} / {disease.lower()}",
        )

    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.sort_values("week_start").reset_index(drop=True)
    df["cases"] = pd.to_numeric(df["cases"], errors="coerce").fillna(0).astype(float)
    for col in ["rainfall_mm", "temp_max_c", "humidity_pct"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df[col] = df[col].ffill().bfill()
        if df[col].isna().any():
            df[col] = df[col].fillna(0.0)
    return df


def _add_features(df: pd.DataFrame) -> pd.DataFrame:
    d = df.copy()
    d["week_of_year"] = d["week_start"].dt.isocalendar().week.astype(int)
    d["sin_week"] = np.sin(2 * np.pi * d["week_of_year"] / 52.0)
    d["cos_week"] = np.cos(2 * np.pi * d["week_of_year"] / 52.0)
    d["cases_lag1"] = d["cases"].shift(1)
    d["cases_lag2"] = d["cases"].shift(2)
    d["cases_lag4"] = d["cases"].shift(4)
    d[["cases_lag1", "cases_lag2", "cases_lag4"]] = d[["cases_lag1", "cases_lag2", "cases_lag4"]].bfill()
    return d


def compute_backtest(district_id: str, disease: str) -> dict:
    """Train on data up to a cutoff, simulate the following weeks, compare to actuals.

    Lead time is defined as the gap (in weeks) between the model's predicted
    peak and the observed outbreak peak within the backtest window — i.e. how
    close the model's forecast pinned the actual peak timing.
    """
    df = _fetch_series(district_id, disease)

    if len(df) < MIN_WEEKS_REQUIRED:
        raise HTTPException(
            status_code=422,
            detail=f"Only {len(df)} weeks of data for {district_id.upper()}/{disease.lower()}; need >= {MIN_WEEKS_REQUIRED}.",
        )

    # Recent post-monsoon outbreak peak (last 26 weeks of the series).
    latest = df["week_start"].max()
    window_start = latest - pd.Timedelta(weeks=PEAK_DETECT_WINDOW_WEEKS)
    recent = df[df["week_start"] >= window_start]
    peak_idx = recent["cases"].idxmax()
    peak_week = df.loc[peak_idx, "week_start"]

    # Cutoff = LEAD_WINDOW weeks before the outbreak peak; hold out the 8 weeks
    # leading up to it plus a short post-peak decline for evaluation.
    cutoff_date = peak_week - pd.Timedelta(weeks=LEAD_WINDOW_WEEKS)
    test_start = cutoff_date + pd.Timedelta(weeks=1)
    test_end = peak_week + pd.Timedelta(weeks=POST_PEAK_WEEKS)

    train = df[df["week_start"] <= cutoff_date].copy()
    test = df[(df["week_start"] >= test_start) & (df["week_start"] <= test_end)].copy()

    if len(train) < MIN_WEEKS_REQUIRED:
        raise HTTPException(status_code=422, detail="Not enough training weeks before the cutoff to backtest.")
    if len(test) == 0:
        raise HTTPException(status_code=422, detail="No held-out weeks fall inside the backtest window.")

    # ---- Baseline (seasonality + case momentum) ----
    train_feats = _add_features(train)
    base_model = HistGradientBoostingRegressor(max_iter=150, learning_rate=0.08, random_state=42)
    base_model.fit(train_feats[BASE_FEATS], train_feats["cases"])
    base_preds = base_model.predict(train_feats[BASE_FEATS])
    residuals = train_feats["cases"] - base_preds

    # ---- Climate residual model ----
    train_feats["rainfall_lag2"] = train_feats["rainfall_mm"].shift(2).fillna(0)
    train_feats["temp_max_lag1"] = train_feats["temp_max_c"].shift(1).fillna(train_feats["temp_max_c"].mean())
    train_feats["humidity_lag1"] = train_feats["humidity_pct"].shift(1).fillna(train_feats["humidity_pct"].mean())
    if HAS_XGB:
        xgb_model = xgb.XGBRegressor(n_estimators=80, learning_rate=0.05, max_depth=4, random_state=42)
    else:
        xgb_model = HistGradientBoostingRegressor(max_iter=80, learning_rate=0.05, max_depth=4, random_state=42)
    xgb_model.fit(train_feats[CLIMATE_FEATS], residuals)

    # ---- Recursive forward simulation over the held-out weeks ----
    # Climate is observed, so its lagged values are known; case momentum lags
    # are fed forward from the training boundary using our own predictions.
    test_feats = _add_features(test)
    full = pd.concat([train_feats, test_feats], ignore_index=True).sort_values("week_start")
    full["rainfall_lag2"] = full["rainfall_mm"].shift(2)
    full["temp_max_lag1"] = full["temp_max_c"].shift(1)
    full["humidity_lag1"] = full["humidity_pct"].shift(1)

    tail = train_feats["cases"].tolist()
    lag1, lag2, lag3, lag4 = tail[-1], tail[-2], tail[-3], tail[-4]

    preds = []
    for idx in test_feats.index:
        row = {
            "sin_week": test_feats.loc[idx, "sin_week"],
            "cos_week": test_feats.loc[idx, "cos_week"],
            "cases_lag1": lag1,
            "cases_lag2": lag2,
            "cases_lag4": lag4,
            "rainfall_mm": full.loc[idx, "rainfall_mm"],
            "temp_max_c": full.loc[idx, "temp_max_c"],
            "humidity_pct": full.loc[idx, "humidity_pct"],
            "rainfall_lag2": full.loc[idx, "rainfall_lag2"] if pd.notna(full.loc[idx, "rainfall_lag2"]) else 0.0,
            "temp_max_lag1": full.loc[idx, "temp_max_lag1"] if pd.notna(full.loc[idx, "temp_max_lag1"]) else train_feats["temp_max_c"].mean(),
            "humidity_lag1": full.loc[idx, "humidity_lag1"] if pd.notna(full.loc[idx, "humidity_lag1"]) else train_feats["humidity_pct"].mean(),
        }
        fdf = pd.DataFrame([row])
        base_p = base_model.predict(fdf[BASE_FEATS])[0]
        residual_p = xgb_model.predict(fdf[CLIMATE_FEATS])[0]
        p = float(max(0.0, base_p + residual_p))
        preds.append(p)
        lag4, lag3, lag2, lag1 = lag3, lag2, lag1, p

    weeks = test_feats["week_start"].dt.strftime("%Y-%m-%d").tolist()
    actual = [float(v) for v in test_feats["cases"].tolist()]
    predicted = [round(p, 1) for p in preds]

    mae = float(mean_absolute_error(actual, predicted))
    rmse = float(np.sqrt(mean_squared_error(actual, predicted)))
    pred_peak_idx = int(np.argmax(predicted))
    pred_peak_week = test_feats["week_start"].iloc[pred_peak_idx]
    peak_timing_error = abs((peak_week - pred_peak_week).days) / 7.0

    return {
        "district_id": district_id.upper(),
        "disease": disease.lower(),
        "cutoff_date": cutoff_date.strftime("%Y-%m-%d"),
        "actual_peak_week": peak_week.strftime("%Y-%m-%d"),
        "predicted_peak_week": pred_peak_week.strftime("%Y-%m-%d"),
        "lead_time_weeks": round(peak_timing_error, 2),
        "weeks": weeks,
        "actual": actual,
        "predicted": predicted,
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
    }


@router.get("", response_model=BacktestEventSchema)
def run_live_backtest(district_id: str, disease: str = Query("dengue"), db: Session = Depends(get_db)):
    """Run a fresh backtest for the given district/disease and persist it."""
    d_id = district_id.upper()
    dis = disease.lower()

    result = compute_backtest(d_id, dis)

    with engine.connect() as conn:
        name_row = conn.execute(
            text("SELECT name FROM districts WHERE id = :d"), {"d": d_id}
        ).fetchone()
    dist_name = name_row[0] if name_row else d_id.title()
    event_name = f"{dist_name} {DISEASE_LABELS.get(dis, dis.title())} Outbreak Backtest"

    metrics = {
        "mae": result["mae"],
        "rmse": result["rmse"],
        "weeks": result["weeks"],
        "actual": result["actual"],
        "predicted": result["predicted"],
        "cutoff_date": result["cutoff_date"],
        "predicted_peak_week": result["predicted_peak_week"],
        "lead_time_weeks": result["lead_time_weeks"],
    }

    run = db.query(BacktestRun).filter(
        BacktestRun.district_id == d_id, BacktestRun.disease == dis
    ).first()
    if run is None:
        run = BacktestRun(district_id=d_id, disease=dis)
        db.add(run)
    run.cutoff_date = datetime.strptime(result["cutoff_date"], "%Y-%m-%d").date()
    run.predicted_curve = [{"date": w, "cases": p} for w, p in zip(result["weeks"], result["predicted"])]
    run.actual_curve = [{"date": w, "cases": a} for w, a in zip(result["weeks"], result["actual"])]
    run.lead_time_weeks = result["lead_time_weeks"]
    run.mae = result["mae"]
    run.rmse = result["rmse"]
    run.computed_at = datetime.utcnow()
    db.commit()
    db.refresh(run)

    return BacktestEventSchema(
        id=run.id,
        district_id=d_id,
        disease=dis,
        event_name=event_name,
        actual_peak_week=datetime.strptime(result["actual_peak_week"], "%Y-%m-%d").date(),
        predicted_lead_weeks=result["lead_time_weeks"],
        metrics_json=metrics,
    )


@router.get("/{event_id}", response_model=BacktestEventSchema)
def get_backtest_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(BacktestEvent).filter(BacktestEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Backtest event '{event_id}' not found")
    return ev
