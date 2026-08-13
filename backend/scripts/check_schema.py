import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from sqlalchemy import create_engine, text

url = os.getenv("DATABASE_URL", "")
engine = create_engine(url, pool_pre_ping=True)
with engine.connect() as conn:
    for t in ["districts", "backtest_events", "backtest_runs", "case_data", "climate_data"]:
        try:
            cols = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name=:t ORDER BY ordinal_position"
            ), {"t": t}).fetchall()
            print(f"{t}: {[c[0] for c in cols]}")
        except Exception as e:
            print(f"{t}: ERR {e}")
