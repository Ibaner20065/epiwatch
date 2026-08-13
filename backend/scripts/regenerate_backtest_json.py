import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
import traceback
from sqlalchemy import create_engine, text
from app.routers.backtest import compute_backtest, DISEASE_LABELS

url = os.getenv("DATABASE_URL", "")
engine = create_engine(url, pool_pre_ping=True)
with engine.connect() as conn:
    districts = conn.execute(text("SELECT id, name FROM districts ORDER BY id")).fetchall()
    name_lookup = {d[0]: d[1] for d in districts}
    diseases = [r[0] for r in conn.execute(text("SELECT DISTINCT disease FROM case_data ORDER BY disease")).fetchall()]

events = []
rid = 1
failures = []
for d_id, d_name in name_lookup.items():
    for dis in diseases:
        try:
            r = compute_backtest(d_id, dis)
            events.append({
                "id": rid,
                "district_id": r["district_id"],
                "disease": r["disease"],
                "event_name": f"{d_name} {DISEASE_LABELS.get(dis, dis.title())} Outbreak Backtest",
                "actual_peak_week": r["actual_peak_week"],
                "predicted_lead_weeks": r["lead_time_weeks"],
                "metrics_json": {
                    "mae": r["mae"],
                    "rmse": r["rmse"],
                    "weeks": r["weeks"],
                    "actual": r["actual"],
                    "predicted": r["predicted"],
                    "cutoff_date": r["cutoff_date"],
                    "predicted_peak_week": r["predicted_peak_week"],
                    "lead_time_weeks": r["lead_time_weeks"],
                },
            })
            rid += 1
        except Exception as e:
            failures.append({"district_id": d_id, "disease": dis, "error": str(e)})

out_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "data", "backtest.json")
with open(out_path, "w") as f:
    json.dump(events, f, indent=2)

print(f"Wrote {len(events)} events to {out_path}")
if failures:
    print("FAILURES:")
    for fl in failures:
        print("  ", fl)
