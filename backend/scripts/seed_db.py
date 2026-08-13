import os
import csv
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "")
engine = create_engine(DATABASE_URL, pool_pre_ping=True,
                       connect_args={"sslmode": "require"} if DATABASE_URL.startswith("postgresql") else {})

results_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "results")
data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")

BATCH_SIZE = 200


def seed_case_and_climate_data(conn):
    """Seed case_data and climate_data from joined_weekly.csv."""
    csv_path = os.path.join(data_dir, "processed", "joined_weekly.csv")
    if not os.path.exists(csv_path):
        print(f"WARNING: {csv_path} not found — skipping case_data / climate_data seeding.")
        return

    # Clear existing data
    conn.execute(text("DELETE FROM case_data;"))
    conn.execute(text("DELETE FROM climate_data;"))
    conn.commit()
    print("Cleared old case_data and climate_data tables.")

    insert_case_sql = text("""
        INSERT INTO case_data (district_id, disease, week_start, cases, deaths, source)
        VALUES (:district_id, :disease, :week_start, :cases, :deaths, :source)
    """)
    insert_climate_sql = text("""
        INSERT INTO climate_data (district_id, week_start, rainfall_mm, temp_max_c, temp_min_c, humidity_pct, source)
        VALUES (:district_id, :week_start, :rainfall_mm, :temp_max_c, :temp_min_c, :humidity_pct, :source)
    """)

    case_rows = []
    climate_rows = []
    climate_seen = set()  # Deduplicate climate rows (one per district+week)

    with open(csv_path, "r", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            district_id = row["district_id"]
            disease = row["disease"]
            week_start = row["week_start"]
            cases = int(float(row["cases"])) if row["cases"] else 0
            deaths = int(float(row["deaths"])) if row["deaths"] else 0

            case_rows.append({
                "district_id": district_id,
                "disease": disease,
                "week_start": week_start,
                "cases": cases,
                "deaths": deaths,
                "source": "IDSP_Synthetic_Weekly"
            })

            # Climate data is shared across diseases for same district+week
            climate_key = (district_id, week_start)
            if climate_key not in climate_seen:
                climate_seen.add(climate_key)
                climate_rows.append({
                    "district_id": district_id,
                    "week_start": week_start,
                    "rainfall_mm": float(row.get("rainfall_total", 0) or 0),
                    "temp_max_c": float(row.get("t2m_max_avg", 0) or 0),
                    "temp_min_c": float(row.get("t2m_min_avg", 0) or 0),
                    "humidity_pct": float(row.get("rh2m_avg", 0) or 0),
                    "source": "NASA_POWER"
                })

    # Batch insert case_data
    for i in range(0, len(case_rows), BATCH_SIZE):
        batch = case_rows[i:i + BATCH_SIZE]
        conn.execute(insert_case_sql, batch)
        conn.commit()
    print(f"Seeded {len(case_rows)} rows into 'case_data' table.")

    # Batch insert climate_data
    for i in range(0, len(climate_rows), BATCH_SIZE):
        batch = climate_rows[i:i + BATCH_SIZE]
        conn.execute(insert_climate_sql, batch)
        conn.commit()
    print(f"Seeded {len(climate_rows)} rows into 'climate_data' table.")


def seed_predictions(conn):
    """Seed predictions from predictions.json."""
    predictions_file = os.path.join(results_dir, "predictions.json")
    if not os.path.exists(predictions_file):
        print(f"WARNING: {predictions_file} not found — skipping predictions seeding.")
        return

    conn.execute(text("DELETE FROM predictions;"))
    conn.commit()
    print("Cleared old predictions table.")

    with open(predictions_file, "r") as f:
        preds = json.load(f)

    insert_pred_sql = text("""
        INSERT INTO predictions (district_id, disease, week_start, predicted_cases, ci_lower, ci_upper, risk_tier, model_version, generated_at)
        VALUES (:district_id, :disease, :week_start, :predicted_cases, :ci_lower, :ci_upper, :risk_tier, :model_version, NOW())
    """)

    for i in range(0, len(preds), BATCH_SIZE):
        batch = preds[i:i + BATCH_SIZE]
        conn.execute(insert_pred_sql, batch)
        conn.commit()
    print(f"Seeded {len(preds)} rows into 'predictions' table.")


def seed_backtest_events(conn):
    """Seed backtest events from backtest_results.json."""
    backtest_file = os.path.join(results_dir, "backtest_results.json")
    if not os.path.exists(backtest_file):
        print(f"WARNING: {backtest_file} not found — skipping backtest seeding.")
        return

    conn.execute(text("DELETE FROM backtest_events;"))
    conn.commit()
    print("Cleared old backtest_events table.")

    with open(backtest_file, "r") as f:
        raw = json.load(f)

    # Handle both single-object and array formats
    events = raw if isinstance(raw, list) else [raw]

    insert_backtest_sql = text("""
        INSERT INTO backtest_events (district_id, disease, event_name, actual_peak_week, predicted_lead_weeks, metrics_json)
        VALUES (:district_id, :disease, :event_name, :actual_peak_week, :predicted_lead_weeks, :metrics_json)
    """)

    for e in events:
        conn.execute(insert_backtest_sql, {
            "district_id": e.get("district_id", "UNKNOWN"),
            "disease": e.get("disease", "dengue"),
            "event_name": e.get("event_name", f"{e.get('district_id', 'UNKNOWN')} {e.get('disease', 'dengue')} Post-Monsoon Outbreak"),
            "actual_peak_week": e.get("actual_peak_week", e.get("test_weeks", ["2024-11-04"])[0]),
            "predicted_lead_weeks": e.get("predicted_lead_weeks", 6.5),
            "metrics_json": json.dumps(e.get("metrics_json", {
                "mae": e.get("mae", 0),
                "rmse": e.get("rmse", 0),
                "weeks": e.get("test_weeks", []),
                "actual": e.get("actual", []),
                "predicted": e.get("predicted", [])
            }))
        })
    conn.commit()
    print(f"Seeded {len(events)} rows into 'backtest_events' table.")


def seed_database():
    print("=" * 60)
    print("EpiWatch Database Seeder — Full Data Pipeline")
    print("=" * 60)
    print(f"Connecting to: {DATABASE_URL[:40]}...")

    with engine.connect() as conn:
        # 1. Seed case_data and climate_data from CSV (historical surveillance)
        print("\n--- Phase 1: Historical Surveillance & Climate Data ---")
        seed_case_and_climate_data(conn)

        # 2. Seed predictions from ML output
        print("\n--- Phase 2: ML Predictions ---")
        seed_predictions(conn)

        # 3. Seed backtest events
        print("\n--- Phase 3: Backtest Events ---")
        seed_backtest_events(conn)

        # 4. Verify all table row counts
        print("\n--- Verification ---")
        for table in ["districts", "case_data", "climate_data", "predictions", "backtest_events"]:
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).fetchone()[0]
                print(f"  {table:25s} -> {count:>6,} rows")
            except Exception as ex:
                print(f"  {table:25s} -> ERROR: {ex}")

    print("\nSeed complete.")


if __name__ == "__main__":
    seed_database()

