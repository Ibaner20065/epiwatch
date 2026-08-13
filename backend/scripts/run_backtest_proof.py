import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from app.routers.backtest import compute_backtest

pairs = [
    ("PUNE", "dengue"),
    ("MUMBAI", "malaria"),
    ("KOLKATA", "dengue"),
    ("NAGPUR", "malaria"),
    ("MUMBAI", "dengue"),
]

out = {}
for d_id, dis in pairs:
    r = compute_backtest(d_id, dis)
    out[f"{d_id}_{dis}"] = {
        "district_id": r["district_id"],
        "disease": r["disease"],
        "cutoff_date": r["cutoff_date"],
        "actual_peak_week": r["actual_peak_week"],
        "predicted_peak_week": r["predicted_peak_week"],
        "lead_time_weeks": r["lead_time_weeks"],
        "mae": r["mae"],
        "rmse": r["rmse"],
        "n_test_weeks": len(r["weeks"]),
    }
    print(json.dumps(out[f"{d_id}_{dis}"], indent=2))
    print("   actual:", r["actual"])
    print("   pred:  ", r["predicted"])
    print("   weeks: ", r["weeks"])
    print()

with open(os.path.join(os.path.dirname(__file__), "..", "..", "ml", "results", "live_backtest_proof.json"), "w") as f:
    json.dump(out, f, indent=2)
print("saved proof json")
