import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
import pandas as pd
import numpy as np
from app.routers.backtest import compute_backtest, _fetch_series

pairs = [("PUNE", "dengue"), ("MUMBAI", "malaria"), ("KOLKATA", "dengue"), ("NAGPUR", "malaria"), ("MUMBAI", "dengue")]

for d_id, dis in pairs:
    r = compute_backtest(d_id, dis)
    df = _fetch_series(d_id, dis)
    train = df[df["week_start"] <= pd.to_datetime(r["cutoff_date"])]["cases"]
    med = float(train.median())
    for q in [0.75, 0.9, 0.95]:
        pass
    ths = {"median": med, "p75": float(train.quantile(0.75)), "p90": float(train.quantile(0.90)),
           "p95": float(train.quantile(0.95)), "max": float(train.max())}
    peak = pd.to_datetime(r["actual_peak_week"])
    weeks = pd.to_datetime(r["weeks"])
    preds = r["predicted"]
    row = f"{d_id}/{dis:8s} peak={r['actual_peak_week']}"
    for name, th in ths.items():
        cross = next((w for w, p in zip(weeks, preds) if p >= th), None)
        lead = (peak - cross).days / 7 if cross is not None else None
        l = f"{lead:5.1f}" if lead is not None else "  N/A"
        row += f"  {name}={l}(th{th:5.1f})"
    print(row)
    print("   preds:", preds)
