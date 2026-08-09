"""Fetch daily climate data from NASA POWER API and aggregate to weekly grain."""
import os
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "backend" / ".env")

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

PARAMETERS = ["T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M"]
COMMUNITY = "AG"

with open(Path(__file__).resolve().parents[1] / "raw" / "census" / "district_population.json") as f:
    DISTRICTS = json.load(f)

RAW_CLIMATE_DIR = Path(__file__).resolve().parents[1] / "raw" / "climate"
RAW_CLIMATE_DIR.mkdir(parents=True, exist_ok=True)

PROCESSED_DIR = Path(__file__).resolve().parents[1] / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

START_DATE = "20170101"
END_DATE = "20251231"

REQUEST_DELAY = 1.0


def fetch_district_climate(district_id: str, lat: float, lon: float) -> dict:
    """Fetch daily climate data for a single district."""
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": COMMUNITY,
        "longitude": lon,
        "latitude": lat,
        "start": START_DATE,
        "end": END_DATE,
        "format": "JSON",
        "header": "true",
        "api_key": NASA_API_KEY,
    }
    response = requests.get(BASE_URL, params=params, timeout=60)
    response.raise_for_status()
    return response.json()


def parse_nasa_response(data: dict, district_id: str) -> pd.DataFrame:
    """Parse NASA POWER API response into a daily DataFrame."""
    props = data.get("properties", {})
    params = props.get("parameter", {})
    
    records = []
    dates = set()
    for param in PARAMETERS:
        if param in params:
            dates.update(params[param].keys())
    
    for date_str in sorted(dates):
        try:
            dt = datetime.strptime(date_str, "%Y%m%d")
        except ValueError:
            continue
        record = {"district_id": district_id, "date": dt}
        for param in PARAMETERS:
            if param in params and date_str in params[param]:
                val = params[param][date_str]
                if val != -999 and val is not None:
                    record[param.lower()] = val
                else:
                    record[param.lower()] = None
            else:
                record[param.lower()] = None
        records.append(record)
    
    return pd.DataFrame(records)


def aggregate_to_weekly(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate daily data to weekly (Monday-Sunday) grain."""
    df = df.copy()
    df["week_start"] = df["date"] - pd.to_timedelta(df["date"].dt.weekday, unit="D")
    
    agg_funcs = {
        "t2m_max": "mean",
        "t2m_min": "mean",
        "prectotcorr": "sum",
        "rh2m": "mean",
    }
    weekly = df.groupby(["district_id", "week_start"]).agg(agg_funcs).reset_index()
    weekly.columns = ["district_id", "week_start", "t2m_max_avg", "t2m_min_avg", "rainfall_total", "rh2m_avg"]
    return weekly


def compute_checksum(filepath: Path) -> str:
    """Compute SHA256 checksum of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def main():
    print("Starting NASA POWER climate data fetch...")
    print(f"Date range: {START_DATE} to {END_DATE}")
    print(f"Districts: {list(DISTRICTS.keys())}")
    
    all_weekly = []
    
    for district_id, info in DISTRICTS.items():
        lat = info["centroid"]["lat"]
        lon = info["centroid"]["lon"]
        print(f"\nFetching {district_id} ({info['district']}, {info['state']})...")
        
        try:
            raw_data = fetch_district_climate(district_id, lat, lon)
            
            raw_file = RAW_CLIMATE_DIR / f"{district_id}.json"
            with open(raw_file, "w") as f:
                json.dump(raw_data, f)
            print(f"  Saved raw data to {raw_file}")
            
            daily_df = parse_nasa_response(raw_data, district_id)
            if daily_df.empty:
                print(f"  WARNING: No data returned for {district_id}")
                continue
            
            weekly_df = aggregate_to_weekly(daily_df)
            all_weekly.append(weekly_df)
            print(f"  Processed {len(daily_df)} daily records -> {len(weekly_df)} weekly records")
            
        except Exception as e:
            print(f"  ERROR fetching {district_id}: {e}")
        
        time.sleep(REQUEST_DELAY)
    
    if all_weekly:
        combined = pd.concat(all_weekly, ignore_index=True)
        combined = combined.sort_values(["district_id", "week_start"]).reset_index(drop=True)
        
        output_file = PROCESSED_DIR / "climate_weekly.csv"
        combined.to_csv(output_file, index=False)
        print(f"\nSaved combined weekly climate data to {output_file}")
        print(f"Total records: {len(combined)}")
        print(f"Date range: {combined['week_start'].min()} to {combined['week_start'].max()}")
        
        checksum = compute_checksum(output_file)
        print(f"SHA256: {checksum}")
    else:
        print("No data fetched successfully.")


if __name__ == "__main__":
    main()