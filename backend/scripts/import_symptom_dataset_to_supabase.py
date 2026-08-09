import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

csv_path = r"C:\Users\INDRAYUDH\Downloads\archive (1)\Indian-Healthcare-Symptom-Disease-Dataset - Sheet1 (2).csv"

def main():
    print("Creating 'archive_symptom_disease_mapping' table in Supabase PostgreSQL...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS archive_symptom_disease_mapping (
                id SERIAL PRIMARY KEY,
                symptom VARCHAR,
                possible_diseases TEXT,
                severity VARCHAR,
                avg_duration_days VARCHAR,
                common_in_region VARCHAR,
                language_availability TEXT
            );
        """))
        conn.execute(text("TRUNCATE TABLE archive_symptom_disease_mapping CASCADE;"))
        conn.commit()

    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    df.columns = [
        "symptom",
        "possible_diseases",
        "severity",
        "avg_duration_days",
        "common_in_region",
        "language_availability"
    ]

    df.to_sql("archive_symptom_disease_mapping", engine, if_exists="append", index=False, method="multi")

    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM archive_symptom_disease_mapping;")).fetchone()[0]
        print(f"SUCCESS: Seeded {count} rows into 'archive_symptom_disease_mapping' in Supabase!")

if __name__ == "__main__":
    main()
