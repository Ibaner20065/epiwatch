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


def run(df, lead_w, post_peak):
    latest = df["week_start"].max()
    recent = df[df["week_start"] >= latest - pd.Timedelta(weeks=26)]
    peak_week = df.loc[recent["cases"].idxmax(), "week_start"]
    cutoff = peak_week - pd.Timedelta(weeks=lead_w)
    test_start = cutoff + pd.Timedelta(weeks=1)
    test_end = peak_week + pd.Timedelta(weeks=post_peak)
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
    full = pd.concat([tr, te], ignore_index=True).sort_values("week_start")
    full["rainfall_lag2"] = full["rainfall_mm"].shift(2)
    full["temp_max_lag1"] = full["temp_max_c"].shift(1)
    full["humidity_lag1"] = full["humidity_pct"].shift(1)
    tail = tr["cases"].tolist()
    lag1, lag2, lag3, lag4 = tail[-1], tail[-2], tail[-3], tail[-4]
    preds = []
    for idx in te.index:
        row = {
            "sin_week": te.loc[idx, "sin_week"], "cos_week": te.loc[idx, "cos_week"],
            "cases_lag1": lag1, "cases_lag2": lag2, "cases_lag4": lag4,
            "rainfall_mm": full.loc[idx, "rainfall_mm"], "temp_max_c": full.loc[idx, "temp_max_c"],
            "humidity_pct": full.loc[idx, "humidity_pct"],
            "rainfall_lag2": full.loc[idx, "rainfall_lag2"] if pd.notna(full.loc[idx, "rainfall_lag2"]) else 0.0,
            "temp_max_lag1": full.loc[idx, "temp_max_lag1"] if pd.notna(full.loc[idx, "temp_max_lag1"]) else tr["temp_max_c"].mean(),
            "humidity_lag1": full.loc[idx, "humidity_lag1"] if pd.notna(full.loc[idx, "humidity_lag1"]) else tr["humidity_pct"].mean(),
        }
        fdf = pd.DataFrame([row])
        p = float(max(0.0, base.predict(fdf[BASE_FEATS])[0] + xg.predict(fdf[CLIMATE_FEATS])[0]))
        preds.append(p)
        lag4, lag3, lag2, lag1 = lag3, lag2, lag1, p
    weeks = te["week_start"]
    actual = te["cases"].astype(float).tolist()
    pidx = int(np.argmax(preds))
    pred_peak = weeks.iloc[pidx]
    leadA = (peak_week - pred_peak).days / 7
    return lead_w, peak_week, cutoff, leadA, actual, preds, weeks.tolist(), float(np.mean(tr["cases"].tolist())), float(tr["cases"].quantile(0.75))


pairs = [("PUNE", "dengue"), ("MUMBAI", "malaria"), ("KOLKATA", "dengue"), ("NAGPUR", "malaria"), ("MUMBAI", "dengue")]
for lead_w, post_peak in [(12, 4), (10, 4), (14, 4)]:
    print(f"=== lead_window={lead_w} post_peak={post_peak} ===")
    for d_id, dis in pairs:
        df = _fetch_series(d_id, dis)
        lw, peak, cutoff, leadA, actual, preds, weeks, mtr, p75 = run(df, lead_w, post_peak)
        print(f"  {d_id}/{dis:8s} peak={peak.date()} cutoff={cutoff.date()} leadA={leadA:5.1f}  p75={p75:5.1f}")
        print(f"      actual={[int(a) for a in actual]}")
        print(f"      pred  ={[round(p,1) for p in preds]}")
    print()
