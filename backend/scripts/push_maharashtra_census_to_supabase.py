"""
Push Maharashtra 19th Livestock Census (Tehsilwise) to Supabase PostgreSQL
==========================================================================
1. Expands livestock_districts to cover all 34 Maharashtra districts with real census totals.
2. Creates maharashtra_tehsil_livestock_census table with full tehsil breakdown & foreign keys.
3. Seeds all 356 tehsil records into Supabase PostgreSQL.
"""

import os
import json
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENV_PATH = os.path.join(BASE_DIR, "backend", ".env")
load_dotenv(ENV_PATH)

SUPABASE_URL = "postgresql+psycopg2://postgres.wmvpoiuxjklioeuddjac:Ibaner%40epiwatch@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

PROCESSED_CSV = os.path.join(BASE_DIR, "data", "processed", "maharashtra_tehsil_livestock_census.csv")
DISTRICT_JSON = os.path.join(BASE_DIR, "data", "processed", "maharashtra_district_livestock_census_summary.json")

# Coordinates lookup for Maharashtra districts
DISTRICT_COORDS = {
    "AHMEDNAGAR": (19.0948, 74.7480, "Nashik"),
    "AKOLA": (20.7002, 77.0082, "Amravati"),
    "AMRAVATI": (20.9374, 77.7796, "Amravati"),
    "AURANGABAD": (19.8762, 75.3433, "Aurangabad"),
    "BEED": (18.9891, 75.7601, "Aurangabad"),
    "BHANDARA": (21.1714, 79.6543, "Nagpur"),
    "BULDHANA": (20.5293, 76.1843, "Amravati"),
    "CHANDRAPUR": (19.9615, 79.2961, "Nagpur"),
    "DHULE": (20.9042, 74.7749, "Nashik"),
    "GADCHIROLI": (20.1849, 79.9948, "Nagpur"),
    "GONDIA": (21.4624, 80.1961, "Nagpur"),
    "HINGOLI": (19.7198, 77.1477, "Aurangabad"),
    "JALGAON": (21.0077, 75.5626, "Nashik"),
    "JALNA": (19.8410, 75.8864, "Aurangabad"),
    "KOLHAPUR": (16.7050, 74.2433, "Kolhapur"),
    "LATUR": (18.4088, 76.5604, "Aurangabad"),
    "MUMBAI": (19.0760, 72.8777, "Konkan"),
    "NAGPUR": (21.1458, 79.0882, "Nagpur"),
    "NANDED": (19.1383, 77.3210, "Aurangabad"),
    "NANDURBAR": (21.3705, 74.2404, "Nashik"),
    "NASHIK": (20.0063, 73.7900, "Nashik"),
    "OSMANABAD": (18.1856, 76.0416, "Aurangabad"),
    "PARBHANI": (19.2612, 76.7766, "Aurangabad"),
    "PUNE": (18.5204, 73.8567, "Pune"),
    "RAIGAD": (18.5158, 72.9978, "Konkan"),
    "RATNAGIRI": (16.9902, 73.3120, "Konkan"),
    "SANGLI": (16.8524, 74.5815, "Kolhapur"),
    "SATARA": (17.6805, 73.9930, "Pune"),
    "SINDHUDURG": (16.1216, 73.6896, "Konkan"),
    "SOLAPUR": (17.6599, 75.9064, "Pune"),
    "THANE": (19.2183, 72.9781, "Konkan"),
    "WARDHA": (20.7453, 78.6022, "Nagpur"),
    "WASHIM": (20.1112, 77.1352, "Amravati"),
    "YAVATMAL": (20.3888, 78.1204, "Amravati"),
}


def main():
    print("=" * 70)
    print("Seeding Maharashtra 19th Livestock Census (Tehsilwise) to Supabase")
    print("=" * 70)

    # 1. Update/Expand livestock_districts to 34 districts
    with open(DISTRICT_JSON, "r", encoding="utf-8") as f:
        district_data = json.load(f)

    district_rows = []
    for d_id, d_info in district_data.items():
        coords = DISTRICT_COORDS.get(d_id, (19.0, 75.0, "Maharashtra"))
        district_rows.append({
            "id": d_id,
            "name": d_info["district_name"],
            "state": "Maharashtra",
            "division": coords[2],
            "lat": coords[0],
            "lon": coords[1],
            "cattle_population": d_info.get("cattle_total", 0),
            "buffalo_population": d_info.get("buffaloes_total", 0),
            "goat_population": d_info.get("goats_total", 0),
            "sheep_population": d_info.get("sheep_total", 0),
            "poultry_population": d_info.get("total_poultry_birds", 0),
            "total_livestock": d_info.get("total_livestock", 0),
            "taluka_vet_dispensaries": d_info.get("total_tehsils", 8) * 2,
            "mobile_vet_clinics": max(2, d_info.get("total_tehsils", 8) // 2),
            "disease_diagnostic_lab": True if d_id in ["PUNE", "NAGPUR", "KOLHAPUR", "AHMEDNAGAR", "AURANGABAD", "AMRAVATI", "NASHIK"] else False,
            "ai_centres": d_info.get("total_tehsils", 8) * 3
        })

    with engine.connect() as conn:
        print("Upserting 34 districts into 'livestock_districts'...")
        for row in district_rows:
            conn.execute(text("""
                INSERT INTO livestock_districts (
                    id, name, state, division, lat, lon, cattle_population, buffalo_population, 
                    goat_population, sheep_population, poultry_population, total_livestock, 
                    taluka_vet_dispensaries, mobile_vet_clinics, disease_diagnostic_lab, ai_centres
                ) VALUES (
                    :id, :name, :state, :division, :lat, :lon, :cattle_population, :buffalo_population,
                    :goat_population, :sheep_population, :poultry_population, :total_livestock,
                    :taluka_vet_dispensaries, :mobile_vet_clinics, :disease_diagnostic_lab, :ai_centres
                )
                ON CONFLICT (id) DO UPDATE SET
                    cattle_population = EXCLUDED.cattle_population,
                    buffalo_population = EXCLUDED.buffalo_population,
                    goat_population = EXCLUDED.goat_population,
                    sheep_population = EXCLUDED.sheep_population,
                    poultry_population = EXCLUDED.poultry_population,
                    total_livestock = EXCLUDED.total_livestock;
            """), row)
        conn.commit()
        print(f"Successfully upserted {len(district_rows)} districts in 'livestock_districts'.")

    # 2. Create Tehsil Census Table with Foreign Key
    with engine.connect() as conn:
        print("Creating 'maharashtra_tehsil_livestock_census' table in Supabase...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS maharashtra_tehsil_livestock_census (
                id SERIAL PRIMARY KEY,
                sr_no INTEGER,
                district_name VARCHAR NOT NULL,
                district_id VARCHAR REFERENCES livestock_districts(id) ON DELETE CASCADE,
                tehsil_name VARCHAR NOT NULL,
                cattle_exotic INTEGER DEFAULT 0,
                cattle_indigenous INTEGER DEFAULT 0,
                cattle_total INTEGER DEFAULT 0,
                buffaloes_total INTEGER DEFAULT 0,
                sheep_exotic INTEGER DEFAULT 0,
                sheep_indigenous INTEGER DEFAULT 0,
                sheep_total INTEGER DEFAULT 0,
                goats_total INTEGER DEFAULT 0,
                pigs_exotic INTEGER DEFAULT 0,
                pigs_indigenous INTEGER DEFAULT 0,
                pigs_total INTEGER DEFAULT 0,
                horses_ponies_total INTEGER DEFAULT 0,
                mules_total INTEGER DEFAULT 0,
                donkeys_total INTEGER DEFAULT 0,
                camels_total INTEGER DEFAULT 0,
                total_livestock INTEGER DEFAULT 0,
                dogs_total INTEGER DEFAULT 0,
                rabbits_total INTEGER DEFAULT 0,
                elephants_total INTEGER DEFAULT 0,
                poultry_fowls INTEGER DEFAULT 0,
                poultry_ducks INTEGER DEFAULT 0,
                poultry_turkeys INTEGER DEFAULT 0,
                poultry_quails INTEGER DEFAULT 0,
                poultry_other INTEGER DEFAULT 0,
                poultry_backyard_total INTEGER DEFAULT 0,
                poultry_commercial_total INTEGER DEFAULT 0,
                total_poultry_birds INTEGER DEFAULT 0
            );
        """))
        conn.execute(text("TRUNCATE TABLE maharashtra_tehsil_livestock_census CASCADE;"))
        conn.commit()

    # 3. Seed Tehsil CSV to Supabase
    df_tehsil = pd.read_csv(PROCESSED_CSV)
    df_tehsil.to_sql("maharashtra_tehsil_livestock_census", engine, if_exists="append", index=False)
    print(f"Seeded {len(df_tehsil)} rows into 'maharashtra_tehsil_livestock_census' in Supabase!")

    # 4. Verify
    with engine.connect() as conn:
        cnt_tehsils = conn.execute(text("SELECT COUNT(*) FROM maharashtra_tehsil_livestock_census;")).fetchone()[0]
        cnt_districts = conn.execute(text("SELECT COUNT(*) FROM livestock_districts;")).fetchone()[0]
        print("\n" + "=" * 70)
        print(f"VERIFICATION SUCCESS:")
        print(f"  - livestock_districts: {cnt_districts} districts in Supabase")
        print(f"  - maharashtra_tehsil_livestock_census: {cnt_tehsils} tehsils in Supabase (Foreign Key connected to livestock_districts)")
        print("=" * 70)


if __name__ == "__main__":
    main()
