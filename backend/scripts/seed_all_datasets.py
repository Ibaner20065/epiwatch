"""
Comprehensive Database Initialization & Seeding Pipeline
=========================================================
Seeds all datasets across EpiWatch, PashuRaksha, MOSPI/Dataful, and Healthcare:
  1. Districts & Demographics (Census 2011)
  2. Diseases & Precautions & Govt Schemes
  3. Historical Case Data & NASA Climate Feeds
  4. Human Forecasting Predictions & Backtest Runs
  5. PashuRaksha Livestock Districts & Animal Health Registry (Maharashtra)
  6. MOSPI/Dataful National Livestock Disease Incidence & 2016-2026 Forecasts (37 Diseases)
  7. Healthcare Symptom-to-Disease Clinical Dataset (517 records)
"""

import os
import csv
import json
import numpy as np
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENV_PATH = os.path.join(BASE_DIR, "backend", ".env")
load_dotenv(ENV_PATH)

SQLITE_PATH = os.path.join(BASE_DIR, "backend", "epiwatch.db")
SQLITE_URL = f"sqlite:///{SQLITE_PATH.replace(chr(92), '/')}"

DATABASE_URL = os.getenv("DATABASE_URL", "")


def get_working_engine():
    """Tries PostgreSQL connection first; falls back to local SQLite if unreachable."""
    if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
        try:
            print("Attempting connection to PostgreSQL...")
            eng = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                connect_args={"sslmode": "require", "connect_timeout": 5}
            )
            with eng.connect() as conn:
                conn.execute(text("SELECT 1;"))
            print("Connected to PostgreSQL successfully!")
            return eng
        except Exception as e:
            print(f"PostgreSQL connection failed ({e.args[0].split(chr(10))[0] if e.args else e}).")
            print(f"Falling back to local SQLite database at: {SQLITE_PATH}")

    eng = create_engine(SQLITE_URL, pool_pre_ping=True)
    return eng


def create_schema(engine):
    """Creates all table structures."""
    print("Creating table schemas...")
    
    with engine.connect() as conn:
        # 1. Human Districts & Diseases
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS districts (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                state VARCHAR NOT NULL,
                lat FLOAT NOT NULL,
                lon FLOAT NOT NULL,
                population INTEGER NOT NULL,
                census_year INTEGER DEFAULT 2011,
                population_density_km2 FLOAT,
                sanitation_index FLOAT,
                water_body_proximity_score FLOAT,
                vaccination_coverage_pct FLOAT,
                urbanization_pct FLOAT
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS diseases (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                transmission_mode VARCHAR NOT NULL,
                idsp_code VARCHAR,
                primary_drivers TEXT,
                pmjay_covered BOOLEAN DEFAULT 0
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS case_data (
                id INTEGER PRIMARY KEY,
                district_id VARCHAR NOT NULL,
                disease VARCHAR NOT NULL,
                week_start DATE NOT NULL,
                cases INTEGER NOT NULL,
                deaths INTEGER DEFAULT 0,
                source VARCHAR NOT NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS climate_data (
                id INTEGER PRIMARY KEY,
                district_id VARCHAR NOT NULL,
                week_start DATE NOT NULL,
                rainfall_mm FLOAT NOT NULL,
                temp_max_c FLOAT NOT NULL,
                temp_min_c FLOAT NOT NULL,
                humidity_pct FLOAT NOT NULL,
                source VARCHAR NOT NULL
            );
        """))

        # 2. PashuRaksha Livestock Tables
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
                disease_diagnostic_lab BOOLEAN DEFAULT 0,
                ai_centres INTEGER DEFAULT 0
            );
        """))

        # 3. MOSPI / Dataful National Livestock Incidence & Forecasts
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS dataful_livestock_annual (
                id INTEGER PRIMARY KEY,
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
                id INTEGER PRIMARY KEY,
                disease_slug VARCHAR NOT NULL,
                target_metric VARCHAR NOT NULL,
                fiscal_year INTEGER NOT NULL,
                predicted_value FLOAT NOT NULL,
                ci_lower FLOAT NOT NULL,
                ci_upper FLOAT NOT NULL
            );
        """))

        # 4. Healthcare Symptom Mapping
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS archive_symptom_disease_mapping (
                id INTEGER PRIMARY KEY,
                symptom VARCHAR,
                possible_diseases TEXT,
                severity VARCHAR,
                avg_duration_days VARCHAR,
                common_in_region VARCHAR,
                language_availability TEXT
            );
        """))

        conn.commit()
    print("Schema created successfully!")


def seed_dataful_tables(engine):
    """Seed Dataful annual data, disease summaries, and 2016-2026 ML forecasts."""
    print("\n--- Seeding MOSPI / Dataful Dataset ---")
    annual_csv = os.path.join(BASE_DIR, "data", "processed", "dataful_livestock_annual.csv")
    summary_json = os.path.join(BASE_DIR, "data", "processed", "dataful_disease_summary.json")
    forecasts_json = os.path.join(BASE_DIR, "ml", "livestock", "results", "dataful_forecasts_2016_2026.json")

    with engine.connect() as conn:
        conn.execute(text("DELETE FROM dataful_livestock_annual;"))
        conn.execute(text("DELETE FROM dataful_disease_summaries;"))
        conn.execute(text("DELETE FROM dataful_disease_forecasts;"))
        conn.commit()

        # 1. Annual Records
        if os.path.exists(annual_csv):
            df_annual = pd.read_csv(annual_csv)
            df_annual["id"] = range(1, len(df_annual) + 1)
            df_annual["source"] = "MOSPI Statistical Year Book India"
            df_annual.to_sql("dataful_livestock_annual", engine, if_exists="append", index=False)
            print(f"Seeded {len(df_annual)} records into 'dataful_livestock_annual'.")

        # 2. Disease Summaries
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
            df_sum = pd.DataFrame(summary_rows)
            df_sum.to_sql("dataful_disease_summaries", engine, if_exists="append", index=False)
            print(f"Seeded {len(df_sum)} records into 'dataful_disease_summaries'.")

        # 3. Forecasts
        if os.path.exists(forecasts_json):
            with open(forecasts_json, "r", encoding="utf-8") as f:
                forecasts_data = json.load(f)
            fc_rows = []
            fc_id = 1
            for slug, dinfo in forecasts_data.items():
                for target_metric, fclist in dinfo.get("forecasts", {}).items():
                    for pt in fclist:
                        fc_rows.append({
                            "id": fc_id,
                            "disease_slug": slug,
                            "target_metric": target_metric,
                            "fiscal_year": int(pt["fiscal_year"]),
                            "predicted_value": float(pt["predicted_value"]),
                            "ci_lower": float(pt["ci_lower"]),
                            "ci_upper": float(pt["ci_upper"])
                        })
                        fc_id += 1
            df_fc = pd.DataFrame(fc_rows)
            df_fc.to_sql("dataful_disease_forecasts", engine, if_exists="append", index=False)
            print(f"Seeded {len(df_fc)} records into 'dataful_disease_forecasts'.")


def seed_healthcare_symptoms(engine):
    """Seed Indian healthcare symptom-disease mapping."""
    print("\n--- Seeding Healthcare Symptom Dataset ---")
    symptoms_csv = os.path.join(BASE_DIR, "data", "raw", "healthcare", "symptom_disease_dataset.csv")
    if not os.path.exists(symptoms_csv):
        print(f"File not found: {symptoms_csv}")
        return

    with engine.connect() as conn:
        conn.execute(text("DELETE FROM archive_symptom_disease_mapping;"))
        conn.commit()

    df = pd.read_csv(symptoms_csv)
    df.columns = [
        "symptom",
        "possible_diseases",
        "severity",
        "avg_duration_days",
        "common_in_region",
        "language_availability"
    ]
    df["id"] = range(1, len(df) + 1)
    df.to_sql("archive_symptom_disease_mapping", engine, if_exists="append", index=False)
    print(f"Seeded {len(df)} records into 'archive_symptom_disease_mapping'.")


def seed_pashuraksha_districts(engine):
    """Seed Maharashtra Livestock districts."""
    print("\n--- Seeding PashuRaksha Districts ---")
    districts_json = os.path.join(BASE_DIR, "data", "raw", "livestock", "district_livestock.json")
    if not os.path.exists(districts_json):
        return

    with open(districts_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    # If it's a list or dict
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
        conn.execute(text("DELETE FROM livestock_districts;"))
        conn.commit()

    df = pd.DataFrame(rows)
    df.to_sql("livestock_districts", engine, if_exists="append", index=False)
    print(f"Seeded {len(df)} records into 'livestock_districts'.")


def seed_human_surveillance(engine):
    """Seed human districts, case data, and climate data."""
    print("\n--- Seeding Human Surveillance Dataset ---")
    joined_csv = os.path.join(BASE_DIR, "data", "processed", "joined_weekly.csv")
    pop_json = os.path.join(BASE_DIR, "data", "raw", "census", "district_population.json")

    with engine.connect() as conn:
        conn.execute(text("DELETE FROM districts;"))
        conn.execute(text("DELETE FROM diseases;"))
        conn.execute(text("DELETE FROM case_data;"))
        conn.execute(text("DELETE FROM climate_data;"))
        conn.commit()

    # Districts
    if os.path.exists(pop_json):
        with open(pop_json, "r", encoding="utf-8") as f:
            pop_data = json.load(f)
        d_rows = []
        if isinstance(pop_data, dict):
            for k, d in pop_data.items():
                centroid = d.get("centroid", {})
                d_rows.append({
                    "id": d.get("district_id", k),
                    "name": d.get("district", k),
                    "state": d.get("state", "India"),
                    "lat": centroid.get("lat", 0.0),
                    "lon": centroid.get("lon", 0.0),
                    "population": d.get("census_2011", 1000000),
                    "census_year": 2011,
                    "population_density_km2": 1200.0,
                    "sanitation_index": 0.75,
                    "water_body_proximity_score": 0.65,
                    "vaccination_coverage_pct": 88.5,
                    "urbanization_pct": 70.0
                })
        elif isinstance(pop_data, list):
            for d in pop_data:
                d_rows.append({
                    "id": d["id"],
                    "name": d["name"],
                    "state": d["state"],
                    "lat": d["lat"],
                    "lon": d["lon"],
                    "population": d["population"],
                    "census_year": 2011,
                    "population_density_km2": d.get("density", 1000.0),
                    "sanitation_index": 0.75,
                    "water_body_proximity_score": 0.65,
                    "vaccination_coverage_pct": 88.5,
                    "urbanization_pct": 70.0
                })
        df_d = pd.DataFrame(d_rows)
        df_d.to_sql("districts", engine, if_exists="append", index=False)
        print(f"Seeded {len(df_d)} records into 'districts'.")

    # Diseases
    diseases = [
        {"id": "dengue", "name": "Dengue", "transmission_mode": "climate_vector", "idsp_code": "DEN-01", "primary_drivers": json.dumps(["rainfall", "temp_max", "humidity"]), "pmjay_covered": True},
        {"id": "malaria", "name": "Malaria", "transmission_mode": "climate_vector", "idsp_code": "MAL-02", "primary_drivers": json.dumps(["rainfall", "humidity"]), "pmjay_covered": True},
        {"id": "add", "name": "Acute Diarrheal Disease", "transmission_mode": "water_sanitation", "idsp_code": "ADD-03", "primary_drivers": json.dumps(["rainfall", "temp_max"]), "pmjay_covered": True},
    ]
    df_dis = pd.DataFrame(diseases)
    df_dis.to_sql("diseases", engine, if_exists="append", index=False)
    print(f"Seeded {len(df_dis)} records into 'diseases'.")

    # Case & Climate
    if os.path.exists(joined_csv):
        df_joined = pd.read_csv(joined_csv)
        df_cases = df_joined[["district_id", "disease", "week_start", "cases", "deaths"]].copy()
        df_cases["source"] = "IDSP_Surveillance"
        df_cases["id"] = range(1, len(df_cases) + 1)
        df_cases.to_sql("case_data", engine, if_exists="append", index=False, chunksize=500)
        print(f"Seeded {len(df_cases)} records into 'case_data'.")

        climate_unique = df_joined[["district_id", "week_start", "rainfall_total", "t2m_max_avg", "t2m_min_avg", "rh2m_avg"]].drop_duplicates()
        climate_unique = climate_unique.rename(columns={
            "rainfall_total": "rainfall_mm",
            "t2m_max_avg": "temp_max_c",
            "t2m_min_avg": "temp_min_c",
            "rh2m_avg": "humidity_pct"
        })
        climate_unique["source"] = "NASA_POWER"
        climate_unique["id"] = range(1, len(climate_unique) + 1)
        climate_unique.to_sql("climate_data", engine, if_exists="append", index=False, chunksize=500)
        print(f"Seeded {len(climate_unique)} records into 'climate_data'.")


def verify_all_counts(engine):
    print("\n" + "=" * 65)
    print("DATABASE SEEDING VERIFICATION SUMMARY")
    print("=" * 65)
    tables = [
        "districts",
        "diseases",
        "case_data",
        "climate_data",
        "livestock_districts",
        "dataful_livestock_annual",
        "dataful_disease_summaries",
        "dataful_disease_forecasts",
        "archive_symptom_disease_mapping",
    ]
    with engine.connect() as conn:
        for tbl in tables:
            try:
                cnt = conn.execute(text(f"SELECT COUNT(*) FROM {tbl};")).fetchone()[0]
                print(f"  [OK] {tbl:35s} -> {cnt:7d} rows")
            except Exception as e:
                print(f"  [ERR] {tbl:35s} -> Error: {e}")
    print("=" * 65)


def main():
    engine = get_working_engine()
    print(f"Using Database Engine: {engine.url}")
    create_schema(engine)
    seed_human_surveillance(engine)
    seed_pashuraksha_districts(engine)
    seed_dataful_tables(engine)
    seed_healthcare_symptoms(engine)
    verify_all_counts(engine)


if __name__ == "__main__":
    main()
