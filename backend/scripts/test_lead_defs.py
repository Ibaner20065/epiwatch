import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
import pandas as pd
from app.routers.backtest import compute_backtest, _fetch_series

pairs = [("PUNE", "dengue"), ("MUMBAI", "malaria"), ("KOLKATA", "dengue"), ("NAGPUR", "malaria"), ("MUMBAI", "dengue")]

for d_id, dis in pairs:
    r = compute_backtest(d_id, dis)
    df = _fetch_series(d_id, dis)
    train = df[df["week_start"] <= pd.to_datetime(r["cutoff_date"])]["cases"]
    mean_tr = float(train.mean())
    p75 = float(train.quantile(0.75))
    p90 = float(train.quantile(0.90))
    cutoff = pd.to_datetime(r["cutoff_date"])
    peak = pd.to_datetime(r["actual_peak_week"])
    weeks = pd.to_datetime(r["weeks"])
    preds = r["predicted"]

    def first_cross(th):
        for w, p in zip(weeks, preds):
            if p >= th:
                return w
        return None

    fA = pd.to_datetime(r["predicted_peak_week"])
    leadA = (peak - fA).days / 7
    leadB = (peak - first_cross(mean_tr)).days / 7
    leadC = (peak - first_cross(p75)).days / 7
    leadD = (peak - cutoff).days / 7
    print(f"{d_id}/{dis:8s} mean_tr={mean_tr:5.1f} p75={p75:5.1f} p90={p90:5.1f} "
          f"leadA(predpeak)={leadA:5.1f} leadB(>mean)={leadB:5.1f} leadC(>p75)={leadC:5.1f} leadD(cutoff)={leadD:5.1f}")
