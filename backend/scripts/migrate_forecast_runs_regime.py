import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "backend", ".env"))
e = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True)

with e.connect() as c:
    c.execute(text("ALTER TABLE forecast_runs ADD COLUMN IF NOT EXISTS regime TEXT NOT NULL DEFAULT 'live'"))
    c.commit()
    print("regime column added")
