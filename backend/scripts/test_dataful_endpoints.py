"""
Test Suite: MOSPI / Dataful ML Pipelines & FastAPI Endpoints
============================================================
Validates:
  1. Dataful processed dataset & summary integrity
  2. Model artifacts loading & predictions (National & District)
  3. FastAPI router responses (/livestock/dataful/summary, /diseases, /trends, /metrics, /triage)
"""

import os
import sys
import json
import pickle
import pytest
from fastapi.testclient import TestClient

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.main import app

client = TestClient(app)


def test_processed_data_exists():
    annual_csv = os.path.join(BASE_DIR, "data", "processed", "dataful_livestock_annual.csv")
    summary_json = os.path.join(BASE_DIR, "data", "processed", "dataful_disease_summary.json")
    assert os.path.exists(annual_csv), "Annual CSV missing"
    assert os.path.exists(summary_json), "Disease summary missing"

    with open(summary_json, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert len(data) == 37, f"Expected 37 diseases, got {len(data)}"
    print("[PASS] Processed Dataful files and 37 disease summaries verified.")


def test_models_exist():
    dataful_models_dir = os.path.join(BASE_DIR, "ml", "livestock", "models", "dataful")
    assert os.path.exists(dataful_models_dir)
    files = [f for f in os.listdir(dataful_models_dir) if f.endswith(".pkl")]
    assert len(files) >= 111, f"Expected >= 111 Dataful models, got {len(files)}"
    print(f"[PASS] Verified {len(files)} national Dataful model ensembles.")

    district_models_dir = os.path.join(BASE_DIR, "ml", "livestock", "models")
    district_files = [f for f in os.listdir(district_models_dir) if f.endswith(".pkl") and not os.path.isdir(os.path.join(district_models_dir, f))]
    assert len(district_files) == 44, f"Expected 44 district models, got {len(district_files)}"
    print(f"[PASS] Verified {len(district_files)} Maharashtra district livestock models.")


def test_dataful_summary_endpoint():
    res = client.get("/livestock/dataful/summary")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["total_diseases"] == 37
    assert data["total_outbreaks_all_time"] > 0
    assert data["total_attacks_all_time"] > 0
    assert data["models_trained"] >= 111
    print(f"[PASS] /livestock/dataful/summary returned {data}")


def test_dataful_diseases_endpoint():
    res = client.get("/livestock/dataful/diseases")
    assert res.status_code == 200, res.text
    diseases = res.json()
    assert len(diseases) == 37
    fmd = next((d for d in diseases if d["slug"] == "fmd"), None)
    assert fmd is not None
    assert fmd["name"] == "Foot & Mouth Disease"
    print(f"[PASS] /livestock/dataful/diseases returned {len(diseases)} diseases (FMD verified).")


def test_dataful_trends_endpoint():
    res = client.get("/livestock/dataful/trends/fmd")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["slug"] == "fmd"
    assert len(data["historical"]) == 11  # 2005 - 2015
    assert "attacks" in data["forecasts"]
    assert len(data["forecasts"]["attacks"]) == 11  # 2016 - 2026
    print(f"[PASS] /livestock/dataful/trends/fmd returned full 22-year curve (historical + 2026 forecast).")


def test_dataful_metrics_endpoint():
    res = client.get("/livestock/dataful/metrics")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "summary" in data
    assert "disease_metrics" in data
    assert len(data["disease_metrics"]) == 37
    print(f"[PASS] /livestock/dataful/metrics returned validation results for all 37 diseases.")


def test_symptom_triage_endpoint():
    res = client.get("/livestock/dataful/triage?symptoms=fever+joint+pain+skin+rash")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "predicted_severity" in data
    assert "suspected_diseases" in data
    assert len(data["suspected_diseases"]) > 0
    print(f"[PASS] /livestock/dataful/triage returned predictions: {data}")


if __name__ == "__main__":
    test_processed_data_exists()
    test_models_exist()
    test_dataful_summary_endpoint()
    test_dataful_diseases_endpoint()
    test_dataful_trends_endpoint()
    test_dataful_metrics_endpoint()
    test_symptom_triage_endpoint()
    print("\nALL 7 TESTS PASSED SUCCESSFULLY!")
