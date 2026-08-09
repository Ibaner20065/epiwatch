"""Process and join IDSP, climate, and population data into unified weekly dataset."""
import os
import json
import hashlib
from pathlib import Path
from datetime import datetime
import pandas as pd

RAW_DIR = Path(__file__).resolve().parents[1] / "raw"
PROCESSED_DIR = Path(__file__).resolve().parents[1] / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

IDSP_FILE = RAW_DIR / "idsp" / "idsp_master.csv"
CLIMATE_FILE = PROCESSED_DIR / "climate_weekly.csv"
POPULATION_FILE = RAW_DIR / "census" / "district_population.json"

DISEASE_MAP = {
    "Dengue": "dengue",
    "DENGUE": "dengue",
    "Malaria": "malaria",
    "MALARIA": "malaria",
    "Acute Diarrhoeal Disease": "add",
    "ACUTE DIARRHOEAL DISEASE": "add",
    "Acute Diarrheal Disease": "add",
    "ADD": "add",
}

TARGET_DISEASES = {"dengue", "malaria", "add"}

DISTRICT_MAP = {
    "PUNE": "PUNE",
    "MUMBAI": "MUMBAI",
    "NAGPUR": "NAGPUR",
    "KOLKATA": "KOLKATA",
    "NORTH 24 PARGANAS": "NORTH_24_PARGANAS",
    "NORTH_24_PARGANAS": "NORTH_24_PARGANAS",
    "HOWRAH": "HOWRAH",
    "BENGALURU URBAN": "BENGALURU_URBAN",
    "BANGALORE URBAN": "BENGALURU_URBAN",
    "MYSURU": "MYSURU",
    "MYSORO": "MYSURU",
    "DHARWAD": "DHARWAD",
}

def compute_checksum(filepath: Path) -> str:
    """Compute SHA256 checksum of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def load_idsp() -> pd.DataFrame:
    """Load and filter IDSP master data."""
    print(f"Loading IDSP data from {IDSP_FILE}...")
    
    if not IDSP_FILE.exists():
        raise FileNotFoundError(f"IDSP file not found: {IDSP_FILE}. Please download from dataful.in")
    
    df = pd.read_csv(IDSP_FILE)
    print(f"  Raw rows: {len(df)}")
    print(f"  Columns: {list(df.columns)}")
    
    required_cols = ["State", "District", "Disease", "Year", "Week", "Cases", "Deaths"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    df["district_id"] = df["District"].str.upper().map(DISTRICT_MAP)
    df = df[df["district_id"].notna()].copy()
    print(f"  After district filter: {len(df)}")
    
    df["disease_key"] = df["Disease"].map(DISEASE_MAP)
    df = df[df["disease_key"].isin(TARGET_DISEASES)].copy()
    print(f"  After disease filter: {len(df)}")
    
    df["week_start"] = pd.to_datetime(df["Year"].astype(str) + "-" + df["Week"].astype(str) + "-1", format="%Y-%W-%w")
    df = df[["district_id", "disease_key", "week_start", "Cases", "Deaths"]].copy()
    df.columns = ["district_id", "disease", "week_start", "cases", "deaths"]
    
    return df


def load_climate() -> pd.DataFrame:
    """Load weekly climate data."""
    print(f"Loading climate data from {CLIMATE_FILE}...")
    
    if not CLIMATE_FILE.exists():
        raise FileNotFoundError(f"Climate file not found: {CLIMATE_FILE}. Run fetch_climate.py first.")
    
    df = pd.read_csv(CLIMATE_FILE)
    df["week_start"] = pd.to_datetime(df["week_start"])
    print(f"  Climate rows: {len(df)}")
    return df


def load_population() -> pd.DataFrame:
    """Load population data."""
    print(f"Loading population data from {POPULATION_FILE}...")
    
    with open(POPULATION_FILE) as f:
        pop_data = json.load(f)
    
    records = []
    for district_id, info in pop_data.items():
        records.append({
            "district_id": district_id,
            "population_census_2011": info["census_2011"],
            "population_projected_2025": info["projected_2025"],
        })
    
    df = pd.DataFrame(records)
    print(f"  Population records: {len(df)}")
    return df


def generate_missing_report(joined: pd.DataFrame) -> dict:
    """Generate missing data report."""
    report = {
        "generated_at": datetime.now().isoformat(),
        "total_records": int(len(joined)),
        "by_district": {},
        "by_disease": {},
        "climate_completeness": {},
    }
    
    for district_id in joined["district_id"].unique():
        subset = joined[joined["district_id"] == district_id]
        report["by_district"][district_id] = {
            "total_weeks": int(len(subset)),
            "weeks_with_cases": int(subset["cases"].notna().sum()),
            "missing_cases_pct": float(subset["cases"].isna().mean() * 100),
        }
    
    for disease in joined["disease"].unique():
        subset = joined[joined["disease"] == disease]
        report["by_disease"][disease] = {
            "total_records": int(len(subset)),
            "missing_cases_pct": float(subset["cases"].isna().mean() * 100),
        }
    
    climate_cols = ["t2m_max_avg", "t2m_min_avg", "rainfall_total", "rh2m_avg"]
    for col in climate_cols:
        if col in joined.columns:
            report["climate_completeness"][col] = float(joined[col].isna().mean() * 100)
    
    return report


def build_manifest() -> dict:
    """Build data manifest with provenance info."""
    manifest = {
        "generated_at": datetime.now().isoformat(),
        "files": {},
    }
    
    for root, dirs, files in os.walk(RAW_DIR):
        for fname in files:
            fpath = Path(root) / fname
            rel_path = fpath.relative_to(RAW_DIR.parent)
            stat = fpath.stat()
            manifest["files"][str(rel_path)] = {
                "size_bytes": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "sha256": compute_checksum(fpath),
            }
    
    for root, dirs, files in os.walk(PROCESSED_DIR):
        for fname in files:
            fpath = Path(root) / fname
            rel_path = fpath.relative_to(RAW_DIR.parent)
            stat = fpath.stat()
            manifest["files"][str(rel_path)] = {
                "size_bytes": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "sha256": compute_checksum(fpath),
            }
    
    return manifest


def main():
    print("=" * 60)
    print("PHASE 1 DATA PROCESSING PIPELINE")
    print("=" * 60)
    
    idsp_df = load_idsp()
    climate_df = load_climate()
    pop_df = load_population()
    
    print("\nMerging IDSP with climate...")
    merged = pd.merge(idsp_df, climate_df, on=["district_id", "week_start"], how="left")
    print(f"  After climate merge: {len(merged)}")
    
    print("Merging with population...")
    merged = pd.merge(merged, pop_df, on="district_id", how="left")
    print(f"  After population merge: {len(merged)}")
    
    merged["case_rate_per_100k"] = (merged["cases"] / merged["population_projected_2025"]) * 100000
    
    merged = merged.sort_values(["district_id", "disease", "week_start"]).reset_index(drop=True)
    
    output_file = PROCESSED_DIR / "joined_weekly.csv"
    merged.to_csv(output_file, index=False)
    print(f"\nSaved joined dataset to {output_file}")
    print(f"  Total records: {len(merged)}")
    print(f"  Districts: {merged['district_id'].nunique()}")
    print(f"  Diseases: {merged['disease'].nunique()}")
    print(f"  Date range: {merged['week_start'].min()} to {merged['week_start'].max()}")
    
    print("\nGenerating missing data report...")
    missing_report = generate_missing_report(merged)
    report_file = PROCESSED_DIR / "missing_data_report.json"
    with open(report_file, "w") as f:
        json.dump(missing_report, f, indent=2)
    print(f"  Saved to {report_file}")
    
    print("\nBuilding data manifest...")
    manifest = build_manifest()
    manifest_file = PROCESSED_DIR.parent / "data_manifest.json"
    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"  Saved to {manifest_file}")
    print(f"  Tracked files: {len(manifest['files'])}")
    
    print("\n" + "=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()