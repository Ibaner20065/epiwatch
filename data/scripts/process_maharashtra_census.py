"""
Maharashtra 19th Livestock & Poultry Census (Tehsilwise) Preprocessing
======================================================================
Processes official tehsil/block-level census data for 34 districts and 356 tehsils
across Maharashtra.

Generates:
  - data/processed/maharashtra_tehsil_livestock_census.csv
  - data/processed/maharashtra_district_livestock_census_summary.json
  - Updates data/data_manifest.json
"""

import os
import json
import hashlib
import numpy as np
import pandas as pd
from datetime import datetime

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_PATH = os.path.join(BASE_DIR, "data", "raw", "census", "maharashtra_19th_livestock_poultry_census_tehsilwise.csv")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "data_manifest.json")

os.makedirs(PROCESSED_DIR, exist_ok=True)

# Standardize district spelling / ID
DISTRICT_ID_MAP = {
    "ahmadnagar": "AHMEDNAGAR",
    "ahmednagar": "AHMEDNAGAR",
    "akola": "AKOLA",
    "amravati": "AMRAVATI",
    "aurangabad": "AURANGABAD",
    "beed": "BEED",
    "bhandara": "BHANDARA",
    "buldhana": "BULDHANA",
    "chandrapur": "CHANDRAPUR",
    "dhule": "DHULE",
    "gadchiroli": "GADCHIROLI",
    "gondia": "GONDIA",
    "hingoli": "HINGOLI",
    "jalgaon": "JALGAON",
    "jalna": "JALNA",
    "kolhapur": "KOLHAPUR",
    "latur": "LATUR",
    "mumbai": "MUMBAI",
    "nagpur": "NAGPUR",
    "nanded": "NANDED",
    "nandurbar": "NANDURBAR",
    "nashik": "NASHIK",
    "osmanabad": "OSMANABAD",
    "parbhani": "PARBHANI",
    "pune": "PUNE",
    "raigad": "RAIGAD",
    "ratnagiri": "RATNAGIRI",
    "sangli": "SANGLI",
    "satara": "SATARA",
    "sindhudurg": "SINDHUDURG",
    "solapur": "SOLAPUR",
    "thane": "THANE",
    "wardha": "WARDHA",
    "washim": "WASHIM",
    "yavatmal": "YAVATMAL",
}


def compute_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


def process_census():
    print("=" * 70)
    print("Processing Maharashtra 19th Livestock & Poultry Census (Tehsilwise)")
    print("=" * 70)

    if not os.path.exists(RAW_PATH):
        raise FileNotFoundError(f"Raw census file not found at {RAW_PATH}")

    df = pd.read_csv(RAW_PATH)
    print(f"Loaded raw census records: {len(df)} rows, {df.shape[1]} columns")

    # Rename & clean columns
    col_mapping = {
        "Sr. No.": "sr_no",
        "Name of the District": "district_name",
        "Tahsil/Block": "tehsil_name",
        "Cattle- exotic/crossbred ": "cattle_exotic",
        "Cattle-indigenous ": "cattle_indigenous",
        "Cattle-Total ": "cattle_total",
        "buffaloes-Total": "buffaloes_total",
        "Sheep-exotic/crossbred": "sheep_exotic",
        "Sheep-indigenous": "sheep_indigenous",
        "sheep-Total ": "sheep_total",
        "Goats-Total": "goats_total",
        "Pigs-exotic/cross bred ": "pigs_exotic",
        "Pigs-Indigenous ": "pigs_indigenous",
        " Pigs -Total": "pigs_total",
        "horses & ponies-Total ": "horses_ponies_total",
        "Mules-Total ": "mules_total",
        " donkeys-Total": "donkeys_total",
        "camels-Total  ": "camels_total",
        "Total Livestock": "total_livestock",
        "Dogs-Total ": "dogs_total",
        "Rabbits-Total ": "rabbits_total",
        "Elephants-Total ": "elephants_total",
        "Poultry-Fowls ": "poultry_fowls",
        "Poultry- Ducks ": "poultry_ducks",
        "Poultry-Turkeys": "poultry_turkeys",
        "Poultry-Quails": "poultry_quails",
        "Poultry-Other Poultry \nbirds": "poultry_other",
        "Total Poultry-Backyard": "poultry_backyard_total",
        "Total Birds in the farm/Hatchery (Layer,Broiler, duck,Emu,others)": "poultry_commercial_total",
        "Total Poultry/P. farm & Hatchery Birds": "total_poultry_birds"
    }

    df = df.rename(columns=col_mapping)

    # Clean text columns
    df["district_name"] = df["district_name"].astype(str).str.strip()
    df["tehsil_name"] = df["tehsil_name"].astype(str).str.strip()
    df["district_id"] = df["district_name"].apply(
        lambda d: DISTRICT_ID_MAP.get(d.lower().strip(), d.upper().replace(" ", "_"))
    )

    # Convert numeric columns safely
    numeric_cols = [c for c in df.columns if c not in ["district_name", "tehsil_name", "district_id"]]
    for c in numeric_cols:
        df[c] = pd.to_numeric(df[c].astype(str).str.replace(",", "").str.strip(), errors="coerce").fillna(0).astype(int)

    # Sort
    df = df.sort_values(["district_name", "tehsil_name"]).reset_index(drop=True)
    df["id"] = range(1, len(df) + 1)

    out_csv = os.path.join(PROCESSED_DIR, "maharashtra_tehsil_livestock_census.csv")
    df.to_csv(out_csv, index=False)
    print(f"Saved processed tehsil census -> {out_csv} ({len(df)} records)")

    # District Level Aggregates
    district_summary = {}
    for d_name, grp in df.groupby("district_name"):
        d_id = grp["district_id"].iloc[0]
        district_summary[d_id] = {
            "district_name": d_name,
            "district_id": d_id,
            "total_tehsils": len(grp),
            "tehsils_list": grp["tehsil_name"].tolist(),
            "cattle_total": int(grp["cattle_total"].sum()),
            "cattle_exotic": int(grp["cattle_exotic"].sum()),
            "cattle_indigenous": int(grp["cattle_indigenous"].sum()),
            "buffaloes_total": int(grp["buffaloes_total"].sum()),
            "sheep_total": int(grp["sheep_total"].sum()),
            "goats_total": int(grp["goats_total"].sum()),
            "pigs_total": int(grp["pigs_total"].sum()),
            "total_livestock": int(grp["total_livestock"].sum()),
            "poultry_backyard_total": int(grp["poultry_backyard_total"].sum()),
            "poultry_commercial_total": int(grp["poultry_commercial_total"].sum()),
            "total_poultry_birds": int(grp["total_poultry_birds"].sum()),
            "dogs_total": int(grp["dogs_total"].sum()),
        }

    out_json = os.path.join(PROCESSED_DIR, "maharashtra_district_livestock_census_summary.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(district_summary, f, indent=2)
    print(f"Saved district aggregates -> {out_json} ({len(district_summary)} districts)")

    # Update manifest
    update_manifest()

    print("=" * 70)
    print("Maharashtra Census Processing Complete!")
    print("=" * 70)
    return df, district_summary


def update_manifest():
    manifest = {}
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            manifest = {}

    files_dict = manifest.get("files", {})
    target_files = [
        os.path.join("data", "raw", "census", "maharashtra_19th_livestock_poultry_census_tehsilwise.csv"),
        os.path.join("data", "processed", "maharashtra_tehsil_livestock_census.csv"),
        os.path.join("data", "processed", "maharashtra_district_livestock_census_summary.json"),
    ]
    for rel_path in target_files:
        full_p = os.path.join(BASE_DIR, rel_path)
        if os.path.exists(full_p):
            stat = os.stat(full_p)
            files_dict[rel_path.replace("/", "\\")] = {
                "size_bytes": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "sha256": compute_sha256(full_p)
            }
    manifest["files"] = files_dict
    manifest["last_updated"] = datetime.now().isoformat()
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Updated data manifest at -> {MANIFEST_PATH}")


if __name__ == "__main__":
    process_census()
