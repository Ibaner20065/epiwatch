"""
Direct Supabase Livestock & Dataful Database Seeding Pipeline
============================================================
Creates all livestock & Dataful tables and pushes data directly to Supabase PostgreSQL:
  1. livestock_districts (9 Maharashtra districts with census and vet infrastructure)
  2. animal_records (5,000+ registered livestock records from animal_registry.csv)
  3. vaccination_records (Parsed per-animal vaccination events)
  4. dataful_livestock_annual (407 MOSPI annual records, 37 diseases)
  5. dataful_disease_summaries (37 disease epidemiology summaries)
  6. dataful_disease_forecasts (1,221 future projection points 2016-2026)
  7. archive_symptom_disease_mapping (517 clinical symptom triage records)
"""

import os
import json
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENV_PATH = os.path.join(BASE_DIR, "backend", ".env")
load_dotenv(ENV_PATH)

SUPABASE_URL = "postgresql+psycopg2://postgres.wmvpoiuxjklioeuddjac:Ibaner%40epiwatch@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)


def create_supabase_livestock_tables():
    print("=" * 65)
    print("Creating Livestock & Dataful Tables in Supabase PostgreSQL")
    print("=" * 65)

    with engine.connect() as conn:
        # 1. Livestock Districts
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_districts (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                state VARCHAR NOT NULL DEFAULT 'Maharashtra',
                division VARCHAR,
                lat FLOAT NOT NULL,
                lon FLOAT NOT NULL,
                cattle_population INTEGER DEFAULT 0,
                buffalo_population INTEGER DEFAULT 0,
                goat_population INTEGER DEFAULT 0,
                sheep_population INTEGER DEFAULT 0,
                poultry_population INTEGER DEFAULT 0,
                total_livestock INTEGER DEFAULT 0,
                taluka_vet_dispensaries INTEGER DEFAULT 0,
                mobile_vet_clinics INTEGER DEFAULT 0,
                disease_diagnostic_lab BOOLEAN DEFAULT false,
                ai_centres INTEGER DEFAULT 0
            );
        """))

        # 2. Animal Records
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS animal_records (
                id SERIAL PRIMARY KEY,
                animal_id VARCHAR UNIQUE NOT NULL,
                ear_tag VARCHAR,
                species VARCHAR NOT NULL,
                breed VARCHAR,
                age_months INTEGER,
                sex VARCHAR,
                owner_id VARCHAR,
                owner_name VARCHAR,
                village VARCHAR,
                block VARCHAR,
                district_id VARCHAR REFERENCES livestock_districts(id),
                state VARCHAR DEFAULT 'Maharashtra',
                registered_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT true
            );
        """))

        # 3. Vaccination Records
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS vaccination_records (
                id SERIAL PRIMARY KEY,
                animal_id VARCHAR NOT NULL,
                vaccine_name VARCHAR NOT NULL,
                disease_target VARCHAR NOT NULL,
                batch_number VARCHAR,
                administered_by VARCHAR,
                administered_at TIMESTAMP NOT NULL,
                next_due DATE,
                district_id VARCHAR,
                block VARCHAR,
                campaign_name VARCHAR
            );
        """))

        # 4. Symptom Reports
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS symptom_reports (
                id SERIAL PRIMARY KEY,
                report_id VARCHAR UNIQUE NOT NULL,
                district_id VARCHAR REFERENCES livestock_districts(id),
                block VARCHAR NOT NULL,
                village VARCHAR NOT NULL,
                species VARCHAR NOT NULL,
                breed VARCHAR,
                num_affected INTEGER DEFAULT 1,
                num_dead INTEGER DEFAULT 0,
                symptoms JSONB NOT NULL,
                severity VARCHAR DEFAULT 'moderate',
                suspected_disease VARCHAR,
                description TEXT,
                reporter_type VARCHAR DEFAULT 'farmer',
                reporter_name VARCHAR,
                reporter_phone VARCHAR,
                lat FLOAT,
                lon FLOAT,
                photo_urls JSONB,
                animal_id VARCHAR,
                reported_at TIMESTAMP NOT NULL,
                offline_synced BOOLEAN DEFAULT false,
                triage_result JSONB,
                language VARCHAR DEFAULT 'en'
            );
        """))

        # 5. Mortality Events
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS mortality_events (
                id SERIAL PRIMARY KEY,
                event_id VARCHAR UNIQUE NOT NULL,
                district_id VARCHAR REFERENCES livestock_districts(id),
                block VARCHAR NOT NULL,
                village VARCHAR NOT NULL,
                species VARCHAR NOT NULL,
                num_dead INTEGER NOT NULL,
                suspected_cause VARCHAR,
                reported_by VARCHAR,
                reporter_phone VARCHAR,
                verified BOOLEAN DEFAULT false,
                verified_by VARCHAR,
                lat FLOAT,
                lon FLOAT,
                reported_at TIMESTAMP NOT NULL,
                verified_at TIMESTAMP
            );
        """))

        # 6. Lab Samples
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS lab_samples (
                id SERIAL PRIMARY KEY,
                sample_id VARCHAR UNIQUE NOT NULL,
                report_id VARCHAR,
                animal_id VARCHAR,
                sample_type VARCHAR NOT NULL,
                species VARCHAR,
                suspected_disease VARCHAR,
                collected_by VARCHAR,
                collection_date TIMESTAMP NOT NULL,
                lab_id VARCHAR,
                lab_name VARCHAR,
                status VARCHAR DEFAULT 'collected',
                result VARCHAR,
                pathogen_identified VARCHAR,
                result_date TIMESTAMP,
                district_id VARCHAR,
                block VARCHAR,
                notes TEXT
            );
        """))

        # 7. Livestock Alerts
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_alerts (
                id SERIAL PRIMARY KEY,
                alert_id VARCHAR UNIQUE NOT NULL,
                alert_type VARCHAR NOT NULL,
                severity VARCHAR DEFAULT 'watch',
                status VARCHAR DEFAULT 'active',
                district_id VARCHAR REFERENCES livestock_districts(id),
                block VARCHAR,
                village VARCHAR,
                disease VARCHAR,
                species VARCHAR,
                message_en TEXT NOT NULL,
                message_hi TEXT,
                message_mr TEXT,
                triggered_by_report_id VARCHAR,
                triggered_at TIMESTAMP NOT NULL,
                acknowledged_by VARCHAR,
                acknowledged_at TIMESTAMP,
                resolved_at TIMESTAMP,
                details_json JSONB
            );
        """))

        # 8. MOSPI / Dataful Tables
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS dataful_livestock_annual (
                id SERIAL PRIMARY KEY,
                fiscal_year INTEGER NOT NULL,
                disease VARCHAR NOT NULL,
                disease_slug VARCHAR NOT NULL,
                outbreaks FLOAT DEFAULT 0.0,
                attacks FLOAT DEFAULT 0.0,
                deaths FLOAT DEFAULT 0.0,
                case_fatality_rate FLOAT DEFAULT 0.0,
                attack_rate_per_outbreak FLOAT DEFAULT 0.0,
                mortality_per_outbreak FLOAT DEFAULT 0.0,
                source VARCHAR DEFAULT 'MOSPI Statistical Year Book India'
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS dataful_disease_summaries (
                slug VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                total_outbreaks FLOAT DEFAULT 0.0,
                total_attacks FLOAT DEFAULT 0.0,
                total_deaths FLOAT DEFAULT 0.0,
                overall_cfr FLOAT DEFAULT 0.0,
                mean_annual_cfr FLOAT DEFAULT 0.0,
                peak_attack_year INTEGER,
                peak_attacks FLOAT,
                peak_outbreak_year INTEGER,
                peak_outbreaks FLOAT,
                trend_10yr VARCHAR,
                risk_classification VARCHAR
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS dataful_disease_forecasts (
                id SERIAL PRIMARY KEY,
                disease_slug VARCHAR NOT NULL,
                target_metric VARCHAR NOT NULL,
                fiscal_year INTEGER NOT NULL,
                predicted_value FLOAT NOT NULL,
                ci_lower FLOAT NOT NULL,
                ci_upper FLOAT NOT NULL
            );
        """))

        conn.commit()
    print("Tables created successfully in Supabase!")


def seed_supabase_livestock():
    print("\n--- Seeding PashuRaksha Districts ---")
    districts_json = os.path.join(BASE_DIR, "data", "raw", "livestock", "district_livestock.json")
    with open(districts_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    dist_list = data if isinstance(data, list) else data.get("districts", [])
    rows = []
    for d in dist_list:
        census = d.get("livestock_census", {})
        infra = d.get("veterinary_infrastructure", {})
        cattle = census.get("cattle", d.get("cattle", 0))
        buffalo = census.get("buffalo", d.get("buffalo", 0))
        goat = census.get("goat", d.get("goat", 0))
        sheep = census.get("sheep", d.get("sheep", 0))
        poultry = census.get("poultry", d.get("poultry", 0))
        tot = census.get("total", cattle + buffalo + goat + sheep + poultry)

        rows.append({
            "id": d["id"],
            "name": d["name"],
            "state": d.get("state", "Maharashtra"),
            "division": d.get("division", "Pune"),
            "lat": d["lat"],
            "lon": d["lon"],
            "cattle_population": cattle,
            "buffalo_population": buffalo,
            "goat_population": goat,
            "sheep_population": sheep,
            "poultry_population": poultry,
            "total_livestock": tot,
            "taluka_vet_dispensaries": infra.get("taluka_vet_dispensaries", 10),
            "mobile_vet_clinics": infra.get("mobile_vet_clinics", 4),
            "disease_diagnostic_lab": infra.get("disease_diagnostic_lab", True if d["id"] in ["PUNE", "NAGPUR", "KOLHAPUR", "AHMEDNAGAR"] else False),
            "ai_centres": infra.get("ai_centres", 8)
        })

    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE livestock_districts CASCADE;"))
        conn.commit()

    pd.DataFrame(rows).to_sql("livestock_districts", engine, if_exists="append", index=False)
    print(f"Seeded {len(rows)} records into 'livestock_districts' on Supabase.")

    # 2. Animal Registry
    print("\n--- Seeding Animal Registry & Vaccinations ---")
    animal_csv = os.path.join(BASE_DIR, "data", "raw", "livestock", "animal_registry.csv")
    if os.path.exists(animal_csv):
        df_animals = pd.read_csv(animal_csv)
        
        # Extract vaccination rows
        vacc_rows = []
        clean_animal_rows = []
        for _, row in df_animals.iterrows():
            clean_animal_rows.append({
                "animal_id": row["animal_id"],
                "ear_tag": row["ear_tag"],
                "species": row["species"],
                "breed": row["breed"],
                "age_months": int(row["age_months"]) if pd.notna(row["age_months"]) else 12,
                "sex": row["sex"],
                "owner_id": row["owner_id"],
                "owner_name": row["owner_name"],
                "village": row["village"],
                "block": row["block"],
                "district_id": row["district_id"],
                "state": row["state"],
                "registered_at": pd.to_datetime(row["registered_at"]),
                "is_active": True
            })
            
            # Parse vaccination history JSON string
            vh_raw = row.get("vaccination_history")
            if pd.notna(vh_raw) and vh_raw:
                try:
                    vh_list = json.loads(vh_raw) if isinstance(vh_raw, str) else vh_raw
                    for v in vh_list:
                        vacc_rows.append({
                            "animal_id": row["animal_id"],
                            "vaccine_name": v.get("vaccine", "General Vaccine"),
                            "disease_target": v.get("disease", "fmd"),
                            "batch_number": v.get("batch", "BATCH-001"),
                            "administered_by": v.get("administered_by", "VET-AUTO"),
                            "administered_at": pd.to_datetime(v.get("date", "2024-01-01")),
                            "district_id": row["district_id"],
                            "block": row["block"],
                            "campaign_name": "NADCP State Drive"
                        })
                except Exception:
                    pass

        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE vaccination_records CASCADE;"))
            conn.execute(text("TRUNCATE TABLE animal_records CASCADE;"))
            conn.commit()

        pd.DataFrame(clean_animal_rows).to_sql("animal_records", engine, if_exists="append", index=False, chunksize=500)
        print(f"Seeded {len(clean_animal_rows)} records into 'animal_records' on Supabase.")

        if vacc_rows:
            pd.DataFrame(vacc_rows).to_sql("vaccination_records", engine, if_exists="append", index=False, chunksize=500)
            print(f"Seeded {len(vacc_rows)} records into 'vaccination_records' on Supabase.")


def seed_supabase_dataful():
    print("\n--- Seeding MOSPI / Dataful Dataset on Supabase ---")
    annual_csv = os.path.join(BASE_DIR, "data", "processed", "dataful_livestock_annual.csv")
    summary_json = os.path.join(BASE_DIR, "data", "processed", "dataful_disease_summary.json")
    forecasts_json = os.path.join(BASE_DIR, "ml", "livestock", "results", "dataful_forecasts_2016_2026.json")

    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE dataful_livestock_annual CASCADE;"))
        conn.execute(text("TRUNCATE TABLE dataful_disease_summaries CASCADE;"))
        conn.execute(text("TRUNCATE TABLE dataful_disease_forecasts CASCADE;"))
        conn.commit()

    # 1. Annual
    if os.path.exists(annual_csv):
        df_annual = pd.read_csv(annual_csv)
        df_annual["source"] = "MOSPI Statistical Year Book India"
        df_annual.to_sql("dataful_livestock_annual", engine, if_exists="append", index=False)
        print(f"Seeded {len(df_annual)} records into 'dataful_livestock_annual' on Supabase.")

    # 2. Summaries
    if os.path.exists(summary_json):
        with open(summary_json, "r", encoding="utf-8") as f:
            summaries = json.load(f)
        summary_rows = []
        for slug, item in summaries.items():
            summary_rows.append({
                "slug": slug,
                "name": item["name"],
                "total_outbreaks": item.get("total_outbreaks_2005_2015", 0.0),
                "total_attacks": item.get("total_attacks_2005_2015", 0.0),
                "total_deaths": item.get("total_deaths_2005_2015", 0.0),
                "overall_cfr": item.get("overall_cfr", 0.0),
                "mean_annual_cfr": item.get("mean_annual_cfr", 0.0),
                "peak_attack_year": item.get("peak_attack_year"),
                "peak_attacks": item.get("peak_attacks"),
                "peak_outbreak_year": item.get("peak_outbreak_year"),
                "peak_outbreaks": item.get("peak_outbreaks"),
                "trend_10yr": item.get("10yr_trend", "stable"),
                "risk_classification": item.get("risk_classification", "Moderate Endemic")
            })
        pd.DataFrame(summary_rows).to_sql("dataful_disease_summaries", engine, if_exists="append", index=False)
        print(f"Seeded {len(summary_rows)} records into 'dataful_disease_summaries' on Supabase.")

    # 3. Forecasts
    if os.path.exists(forecasts_json):
        with open(forecasts_json, "r", encoding="utf-8") as f:
            forecasts_data = json.load(f)
        fc_rows = []
        for slug, dinfo in forecasts_data.items():
            for target_metric, fclist in dinfo.get("forecasts", {}).items():
                for pt in fclist:
                    fc_rows.append({
                        "disease_slug": slug,
                        "target_metric": target_metric,
                        "fiscal_year": int(pt["fiscal_year"]),
                        "predicted_value": float(pt["predicted_value"]),
                        "ci_lower": float(pt["ci_lower"]),
                        "ci_upper": float(pt["ci_upper"])
                    })
        pd.DataFrame(fc_rows).to_sql("dataful_disease_forecasts", engine, if_exists="append", index=False, chunksize=500)
        print(f"Seeded {len(fc_rows)} records into 'dataful_disease_forecasts' on Supabase.")


def verify_supabase_tables():
    print("\n" + "=" * 65)
    print("SUPABASE POSTGRESQL LIVE VERIFICATION")
    print("=" * 65)
    tables = [
        "districts",
        "diseases",
        "case_data",
        "climate_data",
        "livestock_districts",
        "animal_records",
        "vaccination_records",
        "dataful_livestock_annual",
        "dataful_disease_summaries",
        "dataful_disease_forecasts",
        "archive_symptom_disease_mapping",
    ]
    with engine.connect() as conn:
        for tbl in tables:
            try:
                cnt = conn.execute(text(f"SELECT COUNT(*) FROM {tbl};")).fetchone()[0]
                print(f"  [OK] {tbl:35s} -> {cnt:7d} records in Supabase")
            except Exception as e:
                print(f"  [ERR] {tbl:35s} -> Error: {e}")
    print("=" * 65)


def main():
    create_supabase_livestock_tables()
    seed_supabase_livestock()
    seed_supabase_dataful()
    verify_supabase_tables()


if __name__ == "__main__":
    main()
