"""
Dataful / MOSPI Livestock Disease Ingestion & Processing Pipeline
=================================================================
Processes official Ministry of Statistics and Programme Implementation (MOSPI)
incidence data (2005 - 2015) for 37 livestock diseases across India.

Generates:
  - data/processed/dataful_livestock_annual.csv
  - data/processed/dataful_disease_summary.json
  - Updates data/data_manifest.json
"""

import os
import json
import hashlib
import numpy as np
import pandas as pd
from datetime import datetime

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "dataful", "state-wise-incidence-of-livestock-diseases-in-india.csv")
METADATA_PATH = os.path.join(BASE_DIR, "data", "raw", "dataful", "metadata.csv")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "data_manifest.json")

os.makedirs(PROCESSED_DIR, exist_ok=True)

# Standard disease slug mapping
DISEASE_SLUGS = {
    "Foot & Mouth Disease": "fmd",
    "Haemorrhagic Septicaemia": "haemorrhagic_septicaemia",
    "Black Quarter": "black_quarter",
    "Anthrax": "anthrax",
    "Fascioliasis": "fascioliasis",
    "Enterotoxaemia": "enterotoxaemia",
    "Sheep & Goat Pox": "sheep_goat_pox",
    "Cow Pox": "cow_pox",
    "Buffalo Pox": "buffalo_pox",
    "Blue Tongue": "blue_tongue",
    "C.C.P.P.": "ccpp",
    "Amphistomiasis": "amphistomiasis",
    "Schistosomiasis": "schistosomiasis",
    "Swine Fever": "swine_fever",
    "Salmonellosis": "salmonellosis",
    "Coccidiosis": "coccidiosis",
    "Ranikhet (New Castle) Disease": "ranikhet_disease",
    "Fowl Pox": "fowl_pox",
    "Fowl Cholera": "fowl_cholera",
    "Mareks Disease": "mareks_disease",
    "I.B.D.": "ibd",
    "Duck Plague": "duck_plague",
    "Chronic Respiratory Disease": "crd",
    "Canine Distemper": "canine_distemper",
    "Rabies": "rabies",
    "Babesiosis": "babesiosis",
    "Mastitis": "mastitis",
    "Trypanismiasis": "trypanosomiasis",
    "Mange": "mange",
    "Peste Des Petits Ruminant": "ppr",
    "Anaplasmosis": "anaplasmosis",
    "Brucellosis": "brucellosis",
    "Coryza": "coryza",
    "Highly Pathogenic Avian Influenza": "hpai_avian_influenza",
    "Avian Influenza": "ai_h5n1",
    "Equine Influenza": "equine_influenza",
    "Glander Disease": "glanders",
}


def compute_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


def process_dataful_dataset():
    print("=" * 65)
    print("Processing MOSPI / Dataful Livestock Disease Incidence Dataset")
    print("=" * 65)

    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError(f"Raw dataset not found at {RAW_DATA_PATH}")

    df_raw = pd.read_csv(RAW_DATA_PATH)
    print(f"Loaded raw dataset: {df_raw.shape[0]} rows, {df_raw.shape[1]} columns")

    # Clean & fill missing values
    df_raw["value"] = df_raw["value"].fillna(0.0)
    df_raw["fiscal_year"] = df_raw["fiscal_year"].astype(int)
    df_raw["disease"] = df_raw["disease"].str.strip()
    df_raw["incidence_type"] = df_raw["incidence_type"].str.strip().str.capitalize()

    # Pivot to get: fiscal_year, disease, Outbreak, Attack, Death
    pivoted = df_raw.pivot_table(
        index=["fiscal_year", "disease"],
        columns="incidence_type",
        values="value",
        aggfunc="sum",
        fill_value=0.0
    ).reset_index()

    for col in ["Outbreak", "Attack", "Death"]:
        if col not in pivoted.columns:
            pivoted[col] = 0.0

    pivoted = pivoted.rename(columns={
        "Outbreak": "outbreaks",
        "Attack": "attacks",
        "Death": "deaths"
    })

    # Add disease slug
    pivoted["disease_slug"] = pivoted["disease"].apply(
        lambda d: DISEASE_SLUGS.get(d, d.lower().replace(" ", "_").replace(".", "").replace("&", "and"))
    )

    # Derived epidemiological indicators
    pivoted["case_fatality_rate"] = np.where(
        pivoted["attacks"] > 0,
        np.clip(pivoted["deaths"] / pivoted["attacks"], 0.0, 1.0),
        0.0
    )
    pivoted["attack_rate_per_outbreak"] = np.where(
        pivoted["outbreaks"] > 0,
        pivoted["attacks"] / pivoted["outbreaks"],
        0.0
    )
    pivoted["mortality_per_outbreak"] = np.where(
        pivoted["outbreaks"] > 0,
        pivoted["deaths"] / pivoted["outbreaks"],
        0.0
    )

    # Sort
    pivoted = pivoted.sort_values(["disease", "fiscal_year"]).reset_index(drop=True)

    # Save processed annual table
    out_csv = os.path.join(PROCESSED_DIR, "dataful_livestock_annual.csv")
    pivoted.to_csv(out_csv, index=False)
    print(f"Saved processed annual dataset -> {out_csv} ({len(pivoted)} records)")

    # Build Disease Summary JSON
    disease_summaries = {}
    for disease_name, group in pivoted.groupby("disease"):
        slug = group["disease_slug"].iloc[0]
        total_outbreaks = float(group["outbreaks"].sum())
        total_attacks = float(group["attacks"].sum())
        total_deaths = float(group["deaths"].sum())
        
        peak_attack_row = group.loc[group["attacks"].idxmax()]
        peak_outbreak_row = group.loc[group["outbreaks"].idxmax()]
        
        mean_cfr = float(group["case_fatality_rate"].mean())
        overall_cfr = float(total_deaths / total_attacks) if total_attacks > 0 else 0.0
        
        # Trend direction (2005 vs 2015)
        v_2005 = group[group["fiscal_year"] == 2005]["attacks"].sum() if 2005 in group["fiscal_year"].values else 0
        v_2015 = group[group["fiscal_year"] == 2015]["attacks"].sum() if 2015 in group["fiscal_year"].values else 0
        trend = "increasing" if v_2015 > v_2005 * 1.15 else ("decreasing" if v_2015 < v_2005 * 0.85 else "stable")

        # Endemicity / Risk tier
        if total_outbreaks > 1000 or total_attacks > 100000:
            risk_tier = "High Endemic"
        elif total_outbreaks > 100 or total_attacks > 10000:
            risk_tier = "Moderate Endemic"
        else:
            risk_tier = "Sporadic / Low"

        disease_summaries[slug] = {
            "name": disease_name,
            "slug": slug,
            "total_outbreaks_2005_2015": total_outbreaks,
            "total_attacks_2005_2015": total_attacks,
            "total_deaths_2005_2015": total_deaths,
            "overall_cfr": round(overall_cfr, 4),
            "mean_annual_cfr": round(mean_cfr, 4),
            "peak_attack_year": int(peak_attack_row["fiscal_year"]),
            "peak_attacks": float(peak_attack_row["attacks"]),
            "peak_outbreak_year": int(peak_outbreak_row["fiscal_year"]),
            "peak_outbreaks": float(peak_outbreak_row["outbreaks"]),
            "10yr_trend": trend,
            "risk_classification": risk_tier,
            "years_recorded": sorted(group["fiscal_year"].tolist())
        }

    summary_json_path = os.path.join(PROCESSED_DIR, "dataful_disease_summary.json")
    with open(summary_json_path, "w", encoding="utf-8") as f:
        json.dump(disease_summaries, f, indent=2)
    print(f"Saved disease summaries -> {summary_json_path} ({len(disease_summaries)} diseases)")

    # Update Data Manifest
    update_manifest()

    print("=" * 65)
    print("MOSPI / Dataful Ingestion & Processing Complete!")
    print("=" * 65)
    return pivoted, disease_summaries


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
        os.path.join("data", "raw", "dataful", "metadata.csv"),
        os.path.join("data", "raw", "dataful", "state-wise-incidence-of-livestock-diseases-in-india.csv"),
        os.path.join("data", "raw", "healthcare", "symptom_disease_dataset.csv"),
        os.path.join("data", "processed", "dataful_livestock_annual.csv"),
        os.path.join("data", "processed", "dataful_disease_summary.json"),
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
    manifest["last_updated"] = datetime.utcnow().isoformat()

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Updated data manifest at -> {MANIFEST_PATH}")


if __name__ == "__main__":
    process_dataful_dataset()
