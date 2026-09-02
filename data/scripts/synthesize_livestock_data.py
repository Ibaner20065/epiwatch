"""
PashuRaksha — Synthetic Livestock Surveillance Data Generator
=============================================================
Generates realistic animal-health surveillance data for 9 Maharashtra
districts, covering 5 priority diseases across 5 livestock species.

Aligned with:
  - Maharashtra Dept. of Animal Husbandry, Dairy Development & Fisheries
  - DAHD (Govt. of India) disease control programmes
  - INAPH (Information Network for Animal Productivity & Health) schema
  - Livestock Census 2019 proportions for Maharashtra

Outputs:
  data/raw/livestock/livestock_master.csv     — weekly disease reports
  data/raw/livestock/animal_registry.csv      — individual animal records
  data/raw/livestock/district_livestock.json   — district metadata
"""

import csv
import json
import os
import random
import uuid
from datetime import datetime, timedelta

random.seed(42)

# ── Maharashtra Districts (livestock-priority) ──────────────────────
DISTRICTS = [
    {"id": "PUNE",            "name": "Pune",            "division": "Pune",       "lat": 18.5204, "lon": 73.8567, "cattle": 412000, "buffalo": 298000, "goat": 185000, "sheep": 62000,  "poultry": 2100000},
    {"id": "AHMEDNAGAR",      "name": "Ahmednagar",      "division": "Nashik",     "lat": 19.0948, "lon": 74.7480, "cattle": 685000, "buffalo": 520000, "goat": 310000, "sheep": 145000, "poultry": 890000},
    {"id": "NASHIK",          "name": "Nashik",          "division": "Nashik",     "lat": 20.0063, "lon": 73.7900, "cattle": 498000, "buffalo": 380000, "goat": 270000, "sheep": 98000,  "poultry": 1500000},
    {"id": "KOLHAPUR",        "name": "Kolhapur",        "division": "Kolhapur",   "lat": 16.7050, "lon": 74.2433, "cattle": 520000, "buffalo": 445000, "goat": 195000, "sheep": 55000,  "poultry": 3200000},
    {"id": "SANGLI",          "name": "Sangli",          "division": "Kolhapur",   "lat": 16.8524, "lon": 74.5815, "cattle": 390000, "buffalo": 310000, "goat": 260000, "sheep": 120000, "poultry": 980000},
    {"id": "SOLAPUR",         "name": "Solapur",         "division": "Pune",       "lat": 17.6599, "lon": 75.9064, "cattle": 445000, "buffalo": 285000, "goat": 380000, "sheep": 210000, "poultry": 750000},
    {"id": "NAGPUR",          "name": "Nagpur",          "division": "Nagpur",     "lat": 21.1458, "lon": 79.0882, "cattle": 365000, "buffalo": 270000, "goat": 190000, "sheep": 45000,  "poultry": 1200000},
    {"id": "LATUR",           "name": "Latur",           "division": "Aurangabad", "lat": 18.4088, "lon": 76.5604, "cattle": 410000, "buffalo": 340000, "goat": 290000, "sheep": 175000, "poultry": 620000},
    {"id": "JALGAON",         "name": "Jalgaon",         "division": "Nashik",     "lat": 21.0077, "lon": 75.5626, "cattle": 470000, "buffalo": 350000, "goat": 240000, "sheep": 80000,  "poultry": 950000},
]

# ── Diseases ────────────────────────────────────────────────────────
DISEASES = [
    {"id": "fmd",    "name": "Foot-and-Mouth Disease",        "species": ["cattle", "buffalo", "goat", "sheep"],          "transmission": "direct_contact", "peak_months": [1,2,3,10,11,12], "base_rate": 0.015, "mortality_rate": 0.02},
    {"id": "lsd",    "name": "Lumpy Skin Disease",            "species": ["cattle", "buffalo"],                           "transmission": "vector_borne",   "peak_months": [6,7,8,9,10],     "base_rate": 0.012, "mortality_rate": 0.05},
    {"id": "ppr",    "name": "Peste des Petits Ruminants",    "species": ["goat", "sheep"],                               "transmission": "direct_contact", "peak_months": [11,12,1,2,3],    "base_rate": 0.020, "mortality_rate": 0.08},
    {"id": "brucellosis", "name": "Brucellosis",              "species": ["cattle", "buffalo", "goat"],                   "transmission": "direct_contact", "peak_months": list(range(1,13)),"base_rate": 0.005, "mortality_rate": 0.01},
    {"id": "ai_h5n1","name": "Avian Influenza (H5N1)",        "species": ["poultry"],                                     "transmission": "airborne",       "peak_months": [12,1,2,3],       "base_rate": 0.008, "mortality_rate": 0.30},
]

# ── Blocks (talukas) per district — representative subset ──────────
BLOCKS = {
    "PUNE":       ["Haveli", "Mulshi", "Bhor", "Velhe", "Junnar", "Ambegaon", "Baramati", "Indapur"],
    "AHMEDNAGAR": ["Rahuri", "Shrirampur", "Sangamner", "Kopargaon", "Nevasa", "Pathardi", "Parner"],
    "NASHIK":     ["Dindori", "Igatpuri", "Trimbakeshwar", "Sinnar", "Niphad", "Yeola", "Malegaon"],
    "KOLHAPUR":   ["Karveer", "Panhala", "Hatkanangle", "Shirol", "Gaganbawada", "Radhanagari"],
    "SANGLI":     ["Miraj", "Tasgaon", "Walwa", "Shirala", "Kadegaon", "Jath"],
    "SOLAPUR":    ["Barshi", "Madha", "Karmala", "Pandharpur", "Mangalvedhe", "Akkalkot"],
    "NAGPUR":     ["Kamptee", "Hingna", "Saoner", "Katol", "Narkhed", "Umred"],
    "LATUR":      ["Ausa", "Nilanga", "Renapur", "Chakur", "Shirur Anantpal", "Deoni"],
    "JALGAON":    ["Chopda", "Raver", "Yawal", "Erandol", "Pachora", "Bhusawal"],
}

VILLAGES_SUFFIXES = ["wadi", "gaon", "pur", "khurd", "budruk", "tarf", "nagar", "peth"]
SPECIES_LIST = ["cattle", "buffalo", "goat", "sheep", "poultry"]
BREEDS = {
    "cattle":  ["Deoni", "Dangi", "Khillari", "Red Kandhari", "Gir Cross", "HF Cross", "Jersey Cross"],
    "buffalo": ["Murrah", "Pandharpuri", "Nagpuri", "Marathwadi", "Surti"],
    "goat":    ["Osmanabadi", "Sangamneri", "Berari", "Konkan Kanyal", "Sirohi Cross"],
    "sheep":   ["Deccani", "Madgyal", "Lonand", "Kolhapuri"],
    "poultry": ["Desi", "BV380", "Cobb400", "Kadaknath", "Vanaraja"],
}
REPORTER_TYPES = ["farmer", "para_vet", "field_vet", "livestock_inspector", "panchayat_member"]
VACCINES = {
    "fmd":        "FMD Trivalent (O, A, Asia1)",
    "lsd":        "Lumpi-ProVac (GoatPox based)",
    "ppr":        "PPR Sungri/96 Live Attenuated",
    "brucellosis":"Brucella S19 / Rev-1",
    "ai_h5n1":    "AI H5N1 Inactivated (poultry)",
}


def random_village(block: str) -> str:
    prefix = block[:4].lower()
    suffix = random.choice(VILLAGES_SUFFIXES)
    num = random.randint(1, 99)
    return f"{prefix}{suffix}{num}"


def seasonal_multiplier(month: int, peak_months: list) -> float:
    if month in peak_months:
        return random.uniform(1.5, 3.5)
    return random.uniform(0.3, 1.0)


def generate_livestock_master(out_dir: str) -> str:
    """Generate weekly disease surveillance reports."""
    os.makedirs(out_dir, exist_ok=True)
    filepath = os.path.join(out_dir, "livestock_master.csv")

    rows = []
    # 52 weeks from 2024-07-01 to 2025-06-30
    start_date = datetime(2024, 7, 1)

    for week_num in range(52):
        week_start = start_date + timedelta(weeks=week_num)
        month = week_start.month

        for district in DISTRICTS:
            for disease in DISEASES:
                for species in disease["species"]:
                    pop_key = species if species != "poultry" else "poultry"
                    population = district.get(pop_key, 100000)

                    # Base cases scaled by population and season
                    base = disease["base_rate"] * (population / 100000)
                    mult = seasonal_multiplier(month, disease["peak_months"])
                    expected_cases = base * mult

                    reported_cases = max(0, int(random.gauss(expected_cases, expected_cases * 0.4)))
                    deaths = int(reported_cases * disease["mortality_rate"] * random.uniform(0.5, 2.0))
                    deaths = min(deaths, reported_cases)

                    if reported_cases == 0 and random.random() > 0.3:
                        continue  # Skip zero-case weeks occasionally for realism

                    block = random.choice(BLOCKS[district["id"]])
                    village = random_village(block)
                    reporter = random.choice(REPORTER_TYPES)

                    # Jitter GPS around district centroid
                    lat = district["lat"] + random.uniform(-0.15, 0.15)
                    lon = district["lon"] + random.uniform(-0.15, 0.15)

                    rows.append({
                        "district_id": district["id"],
                        "district_name": district["name"],
                        "division": district["division"],
                        "block": block,
                        "village": village,
                        "species": species,
                        "disease_id": disease["id"],
                        "disease_name": disease["name"],
                        "week_start": week_start.strftime("%Y-%m-%d"),
                        "reported_cases": reported_cases,
                        "deaths": deaths,
                        "reporter_type": reporter,
                        "lat": round(lat, 6),
                        "lon": round(lon, 6),
                        "state": "Maharashtra",
                    })

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} livestock surveillance rows → {filepath}")
    return filepath


def generate_animal_registry(out_dir: str) -> str:
    """Generate individual animal records with vaccination history."""
    os.makedirs(out_dir, exist_ok=True)
    filepath = os.path.join(out_dir, "animal_registry.csv")

    rows = []
    for district in DISTRICTS:
        # ~550 animals per district
        n_animals = random.randint(500, 600)
        for _ in range(n_animals):
            species = random.choice(SPECIES_LIST)
            breed = random.choice(BREEDS[species])
            block = random.choice(BLOCKS[district["id"]])
            village = random_village(block)
            sex = random.choice(["male", "female", "female", "female"])  # bias toward female (dairy)
            age_months = random.randint(3, 120) if species != "poultry" else random.randint(1, 24)
            ear_tag = f"MH-{district['id'][:3]}-{uuid.uuid4().hex[:6].upper()}"
            owner_id = f"OWN-{district['id'][:3]}-{random.randint(1000,9999)}"
            owner_name = f"Owner_{random.randint(1,500)}"

            # Vaccination history (JSON array)
            vacc_history = []
            for disease in DISEASES:
                if species in disease["species"] and random.random() > 0.35:
                    vacc_date = datetime(2024, random.randint(1,12), random.randint(1,28))
                    vacc_history.append({
                        "vaccine": VACCINES[disease["id"]],
                        "disease": disease["id"],
                        "date": vacc_date.strftime("%Y-%m-%d"),
                        "batch": f"BATCH-{random.randint(1000,9999)}",
                        "administered_by": f"VET-{district['id'][:3]}-{random.randint(100,999)}",
                    })

            rows.append({
                "animal_id": f"AN-{uuid.uuid4().hex[:8].upper()}",
                "ear_tag": ear_tag,
                "species": species,
                "breed": breed,
                "age_months": age_months,
                "sex": sex,
                "owner_id": owner_id,
                "owner_name": owner_name,
                "village": village,
                "block": block,
                "district_id": district["id"],
                "district_name": district["name"],
                "state": "Maharashtra",
                "vaccination_history": json.dumps(vacc_history),
                "registered_at": datetime(2024, random.randint(1,6), random.randint(1,28)).strftime("%Y-%m-%d"),
            })

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} animal registry rows → {filepath}")
    return filepath


def generate_district_metadata(out_dir: str) -> str:
    """Generate district livestock metadata JSON."""
    os.makedirs(out_dir, exist_ok=True)
    filepath = os.path.join(out_dir, "district_livestock.json")

    data = []
    for d in DISTRICTS:
        data.append({
            "id": d["id"],
            "name": d["name"],
            "state": "Maharashtra",
            "division": d["division"],
            "lat": d["lat"],
            "lon": d["lon"],
            "livestock_census": {
                "cattle": d["cattle"],
                "buffalo": d["buffalo"],
                "goat": d["goat"],
                "sheep": d["sheep"],
                "poultry": d["poultry"],
                "total": d["cattle"] + d["buffalo"] + d["goat"] + d["sheep"] + d["poultry"],
            },
            "veterinary_infrastructure": {
                "district_vet_hospital": 1,
                "taluka_vet_dispensaries": random.randint(6, 15),
                "mobile_vet_clinics": random.randint(2, 8),
                "ai_centres": random.randint(10, 40),
                "disease_diagnostic_lab": random.choice([True, False]),
            },
            "govt_schemes": [
                "Rashtriya Gokul Mission",
                "National Animal Disease Control Programme (NADCP)",
                "Livestock Health & Disease Control (LH&DC)",
                "Maharashtra Pashu Sanjeevani",
                "National Digital Livestock Mission",
            ],
        })

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Generated district metadata → {filepath}")
    return filepath


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "raw", "livestock")
    generate_livestock_master(out)
    generate_animal_registry(out)
    generate_district_metadata(out)
    print("\n✅ All livestock synthetic data generated.")
