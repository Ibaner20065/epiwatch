import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
import pandas as pd
import numpy as np
from app.routers.backtest import _fetch_series
from sklearn.ensemble import HistGradientBoostingRegressor
import xgboost as xgb

BASE_FEATS = ["sin_week", "cos_week", "cases_lag1", "cases_lag2", "cases_lag4"]
CLIMATE_FEATS = ["rainfall_mm", "temp_max_c", "humidity_pct", "rainfall_lag2", "temp_max_lag1", "humidity_lag1"]


def add_feats(d):
    d = d.copy()
    d["week_of_year"] = d["week_start"].dt.isocalendar().week.astype(int)
    d["sin_week"] = np.sin(2 * np.pi * d["week_of_year"] / 52)
    d["cos_week"] = np.cos(2 * np.pi * d["week_of_year"] / 52)
    d["cases_lag1"] = d["cases"].shift(1)
    d["cases_lag2"] = d["cases"].shift(2)
    d["cases_lag4"] = d["cases"].shift(4)
    d[["cases_lag1", "cases_lag2", "cases_lag4"]] = d[["cases_lag1", "cases_lag2", "cases_lag4"]].bfill()
    return d


def run(df):
    latest = df["week_start"].max()
    recent = df[df["week_start"] >= latest - pd.Timedelta(weeks=26)]
    peak_week = df.loc[recent["cases"].idxmax(), "week_start"]
    cutoff = peak_week - pd.Timedelta(weeks=8)
    test_start = cutoff + pd.Timedelta(weeks=1)
    test_end = peak_week + pd.Timedelta(weeks=4)
    train = df[df["week_start"] <= cutoff].copy()
    test = df[(df["week_start"] >= test_start) & (df["week_start"] <= test_end)].copy()
    tr = add_feats(train)
    base = HistGradientBoostingRegressor(max_iter=150, learning_rate=0.08, random_state=42)
    base.fit(tr[BASE_FEATS], tr["cases"])
    bp = base.predict(tr[BASE_FEATS])
    res = tr["cases"] - bp
    tr["rainfall_lag2"] = tr["rainfall_mm"].shift(2).fillna(0)
    tr["temp_max_lag1"] = tr["temp_max_c"].shift(1).fillna(tr["temp_max_c"].mean())
    tr["humidity_lag1"] = tr["humidity_pct"].shift(1).fillna(tr["humidity_pct"].mean())
    xg = xgb.XGBRegressor(n_estimators=80, learning_rate=0.05, max_depth=4, random_state=42)
    xg.fit(tr[CLIMATE_FEATS], res)

    te = add_feats(test)
    te["cases_lag1"] = tr["cases"].iloc[-1]
    te["cases_lag2"] = tr["cases"].iloc[-2]
    te["cases_lag4"] = tr["cases"].iloc[-4]
    te["rainfall_lag2"] = te["rainfall_mm"].shift(2).fillna(0)
    te["temp_max_lag1"] = te["temp_max_c"].shift(1).fillna(tr["temp_max_c"].mean())
    te["humidity_lag1"] = te["humidity_pct"].shift(1).fillna(tr["humidity_pct"].mean())
    preds = np.maximum(0, base.predict(te[BASE_FEATS]) + xg.predict(te[CLIMATE_FEATS]))
    pidx = int(np.argmax(preds))
    pred_peak = te["week_start"].iloc[pidx]
    return peak_week, pred_peak, (peak_week - pred_peak).days / 7, te["week_start"].tolist(), preds.tolist()


for d_id, dis in [("PUNE", "dengue"), ("MUMBAI", "malaria"), ("KOLKATA", "dengue"), ("NAGPUR", "malaria"), ("MUMBAI", "dengue")]:
    df = _fetch_series(d_id, dis)
    peak, pred_peak, lead, weeks, preds = run(df)
    print(f"{d_id}/{dis:8s} actual_peak={peak.date()} pred_peak={pred_peak.date()} lead={lead:5.1f}")
    print(f"      pred={[round(p,1) for p in preds]}")
