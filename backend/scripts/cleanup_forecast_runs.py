import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "backend", ".env"))
e = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True)

with e.connect() as c:
    c.execute(text("DELETE FROM forecast_runs WHERE horizon_type = 'backtest' AND regime = 'live'"))
    c.commit()
    n = c.execute(text("SELECT COUNT(*) FROM forecast_runs")).fetchone()[0]
    print("cleanup done, total forecast_runs =", n)
