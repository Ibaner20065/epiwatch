"""Generate realistic sample IDSP data for 9 districts x 3 diseases (2017-2024)."""
import csv
import random
import os
from pathlib import Path

random.seed(42)

DISTRICTS = [
    ("Maharashtra", "Pune", "PUNE"),
    ("Maharashtra", "Mumbai", "MUMBAI"),
    ("Maharashtra", "Nagpur", "NAGPUR"),
    ("West Bengal", "Kolkata", "KOLKATA"),
    ("West Bengal", "North 24 Parganas", "NORTH_24_PARGANAS"),
    ("West Bengal", "Howrah", "HOWRAH"),
    ("Karnataka", "Bengaluru Urban", "BENGALURU_URBAN"),
    ("Karnataka", "Mysuru", "MYSURU"),
    ("Karnataka", "Dharwad", "DHARWAD"),
]

# Disease seasonal profiles: (peak_week, peak_amplitude)
# Peak week ~ Aug/Sep (week 33-38) for vector-borne; water-borne peaks monsoon too
DISEASES = [
    ("Dengue", 36, 1.0),
    ("Malaria", 32, 0.6),
    ("Acute Diarrhoeal Disease", 38, 0.8),
]

YEARS = list(range(2017, 2025))


def seasonal_cases(week, peak_week, base, amplitude):
    """Sinusoidal seasonal pattern, higher during monsoon (Jun-Oct, weeks 23-42)."""
    import math
    # base seasonality: peak at peak_week, trough at peak_week-26
    seasonal = 1 + amplitude * math.cos(2 * math.pi * (week - peak_week) / 52)
    return max(0, int(base * seasonal + random.gauss(0, base * 0.12)))


def main():
    output_dir = Path(__file__).resolve().parents[1] / "raw" / "idsp"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "idsp_master.csv"

    # District scale factor (larger population -> more cases)
    scale = {
        "PUNE": 1.0,
        "MUMBAI": 1.3,
        "NAGPUR": 0.55,
        "KOLKATA": 0.7,
        "NORTH_24_PARGANAS": 0.9,
        "HOWRAH": 0.5,
        "BENGALURU_URBAN": 1.2,
        "MYSURU": 0.35,
        "DHARWAD": 0.25,
    }

    rows = []
    for state, district, did in DISTRICTS:
        for disease, peak_week, amplitude in DISEASES:
            base = {
                "Dengue": 60,
                "Malaria": 35,
                "Acute Diarrhoeal Disease": 80,
            }[disease] * scale[did]

            for year in YEARS:
                for week in range(1, 53):
                    cases = seasonal_cases(week, peak_week, base, amplitude)
                    # occasional reporting gaps
                    if random.random() < 0.02:
                        cases = 0
                    deaths = random.choices(
                        [0, 0, 0, 1, 1, 2],
                        weights=[80, 12, 4, 2, 1, 1],
                    )[0]
                    if cases == 0:
                        deaths = 0
                    rows.append([state, district, disease, year, week, cases, deaths])

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["State", "District", "Disease", "Year", "Week", "Cases", "Deaths"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {output_file}")


if __name__ == "__main__":
    main()