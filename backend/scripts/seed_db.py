import os
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

results_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "results")

def seed_database():
    print("Connecting to Supabase PostgreSQL...")
    with engine.connect() as conn:
        # Clear existing predictions and backtest events
        conn.execute(text("DELETE FROM predictions;"))
        conn.execute(text("DELETE FROM backtest_events;"))
        conn.commit()
        print("Cleared old predictions and backtest tables.")

        # Seed Predictions
        predictions_file = os.path.join(results_dir, "predictions.json")
        if os.path.exists(predictions_file):
            with open(predictions_file, "r") as f:
                preds = json.load(f)
            
            insert_pred_sql = text("""
                INSERT INTO predictions (district_id, disease, week_start, predicted_cases, ci_lower, ci_upper, risk_tier, model_version, generated_at)
                VALUES (:district_id, :disease, :week_start, :predicted_cases, :ci_lower, :ci_upper, :risk_tier, :model_version, NOW())
            """)
            
            for p in preds:
                conn.execute(insert_pred_sql, {
                    "district_id": p["district_id"],
                    "disease": p["disease"],
                    "week_start": p["week_start"],
                    "predicted_cases": p["predicted_cases"],
                    "ci_lower": p["ci_lower"],
                    "ci_upper": p["ci_upper"],
                    "risk_tier": p["risk_tier"],
                    "model_version": p["model_version"]
                })
            conn.commit()
            print(f"Seeded {len(preds)} rows into 'predictions' table.")

        # Seed Backtest Events
        backtest_file = os.path.join(results_dir, "backtest_results.json")
        if os.path.exists(backtest_file):
            with open(backtest_file, "r") as f:
                events = json.load(f)
            
            insert_backtest_sql = text("""
                INSERT INTO backtest_events (district_id, disease, event_name, actual_peak_week, predicted_lead_weeks, metrics_json)
                VALUES (:district_id, :disease, :event_name, :actual_peak_week, :predicted_lead_weeks, :metrics_json)
            """)
            
            for e in events:
                conn.execute(insert_backtest_sql, {
                    "district_id": e["district_id"],
                    "disease": e["disease"],
                    "event_name": e["event_name"],
                    "actual_peak_week": e["actual_peak_week"],
                    "predicted_lead_weeks": e["predicted_lead_weeks"],
                    "metrics_json": json.dumps(e["metrics_json"])
                })
            conn.commit()
            print(f"Seeded {len(events)} rows into 'backtest_events' table.")

        # Verify row counts
        res_pred = conn.execute(text("SELECT COUNT(*) FROM predictions")).fetchone()[0]
        res_bt = conn.execute(text("SELECT COUNT(*) FROM backtest_events")).fetchone()[0]
        print(f"VERIFICATION: predictions table has {res_pred} rows, backtest_events table has {res_bt} rows.")

if __name__ == "__main__":
    seed_database()
