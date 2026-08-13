import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from sqlalchemy import create_engine, text

url = os.getenv("DATABASE_URL", "")
engine = create_engine(url, pool_pre_ping=True)
with engine.connect() as conn:
    tables = [r[0] for r in conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'")).fetchall()]
    print("TABLES:", tables)
    for t in sorted(tables):
        try:
            n = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).fetchone()[0]
            print(f"  {t}: {n} rows")
        except Exception as e:
            print(f"  {t}: ERR {e}")
    if "backtest_events" in tables:
        rows = conn.execute(text("SELECT id, district_id, disease, actual_peak_week, predicted_lead_weeks FROM backtest_events")).fetchall()
        print("BACKTEST_EVENTS:", rows)
    if "case_data" in tables:
        rows = conn.execute(text("SELECT district_id, disease, COUNT(*), MIN(week_start), MAX(week_start) FROM case_data GROUP BY district_id, disease ORDER BY district_id")).fetchall()
        for r in rows:
            print("CASE:", r)
