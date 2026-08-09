"""Create EpiWatch database tables in Supabase PostgreSQL (idempotent)."""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import inspect, text  # noqa: E402

from app.db import engine  # noqa: E402
from app.models import Base  # noqa: E402


def main():
    print("Creating EpiWatch tables in Supabase PostgreSQL...")
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables present after create_all: {tables}")

    expected = ["districts", "case_data", "climate_data", "predictions", "backtest_events"]
    missing = [t for t in expected if t not in tables]
    if missing:
        print(f"WARNING: Missing tables: {missing}")
        sys.exit(1)

    for table in expected:
        cols = [c["name"] for c in inspector.get_columns(table)]
        print(f"  {table}: columns={cols}")

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("DONE: All tables verified.")


if __name__ == "__main__":
    main()
