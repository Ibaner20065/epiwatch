import os
import glob
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

archive_dir = r"C:\Users\INDRAYUDH\Downloads\archive"

def create_archive_tables():
    print("Creating archive tables in Supabase PostgreSQL...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS archive_hospitals (
                hospital_id VARCHAR PRIMARY KEY,
                name VARCHAR,
                state VARCHAR,
                tier VARCHAR,
                beds INTEGER,
                teaching BOOLEAN
            );
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS archive_patients (
                patient_id VARCHAR PRIMARY KEY,
                age INTEGER,
                gender VARCHAR,
                state VARCHAR,
                bpl_card BOOLEAN,
                insurance_type VARCHAR,
                comorbidity_count INTEGER,
                prev_admissions INTEGER
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS archive_admissions (
                admission_id VARCHAR PRIMARY KEY,
                patient_id VARCHAR,
                admit_date DATE,
                discharge_date DATE,
                los_days INTEGER,
                admit_type VARCHAR,
                ward_type VARCHAR,
                hospital_id VARCHAR,
                discharge_type VARCHAR,
                num_procedures INTEGER,
                charlson_index INTEGER,
                hba1c FLOAT,
                creatinine FLOAT,
                haemoglobin FLOAT,
                systolic_bp INTEGER,
                readmitted_30d INTEGER,
                readmitted_7d INTEGER
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS archive_diagnoses (
                diag_id VARCHAR PRIMARY KEY,
                admission_id VARCHAR,
                icd10_code VARCHAR,
                diag_desc VARCHAR,
                diag_rank INTEGER,
                diag_category VARCHAR
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS archive_billing (
                bill_id VARCHAR PRIMARY KEY,
                admission_id VARCHAR,
                total_cost_inr FLOAT,
                govt_subsidy_inr FLOAT,
                out_of_pocket_inr FLOAT,
                cost_category VARCHAR
            );
        """))
        conn.commit()
        print("Archive tables created successfully!")

def load_csv_in_chunks(file_path, table_name, chunksize=10000):
    print(f"Loading {file_path} into Supabase table '{table_name}'...")
    total_rows = 0
    for chunk in pd.read_csv(file_path, chunksize=chunksize):
        chunk.to_sql(table_name, engine, if_exists="append", index=False, method="multi")
        total_rows += len(chunk)
        print(f"  -> Uploaded {total_rows} rows into {table_name}")
    return total_rows

def main():
    create_archive_tables()

    # Clear existing data in archive tables for clean reload
    with engine.connect() as conn:
        for t in ["archive_billing", "archive_diagnoses", "archive_admissions", "archive_patients", "archive_hospitals"]:
            conn.execute(text(f"TRUNCATE TABLE {t} CASCADE;"))
        conn.commit()

    hospitals_csv = os.path.join(archive_dir, "hospitals.csv")
    patients_csv = os.path.join(archive_dir, "patients.csv")
    admissions_csv = os.path.join(archive_dir, "admissions.csv")
    diagnoses_csv = os.path.join(archive_dir, "diagnoses.csv")
    billing_csv = os.path.join(archive_dir, "billing.csv")

    r_h = load_csv_in_chunks(hospitals_csv, "archive_hospitals")
    r_p = load_csv_in_chunks(patients_csv, "archive_patients")
    r_a = load_csv_in_chunks(admissions_csv, "archive_admissions")
    r_d = load_csv_in_chunks(diagnoses_csv, "archive_diagnoses")
    r_b = load_csv_in_chunks(billing_csv, "archive_billing")

    print(f"\nCOMPLETED ARCHIVE IMPORT INTO SUPABASE!")
    print(f"Summary:")
    print(f"  - archive_hospitals: {r_h} rows")
    print(f"  - archive_patients: {r_p} rows")
    print(f"  - archive_admissions: {r_a} rows")
    print(f"  - archive_diagnoses: {r_d} rows")
    print(f"  - archive_billing: {r_b} rows")

if __name__ == "__main__":
    main()
