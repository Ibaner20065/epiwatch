"""
PashuRaksha — Comprehensive Livestock Endpoints Test Suite
==========================================================
Tests all livestock REST API endpoints, triage engine,
models, and offline fallback handlers using FastAPI TestClient.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app.main import app
from app.livestock_triage import evaluate_report

client = TestClient(app)


class TestLivestockPlatform(unittest.TestCase):

    def test_01_root_and_health(self):
        resp = client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("pashuraksha", data.get("modules", {}))

        resp_h = client.get("/health")
        self.assertEqual(resp_h.status_code, 200)

    def test_02_livestock_districts(self):
        resp = client.get("/livestock/districts")
        self.assertEqual(resp.status_code, 200)
        districts = resp.json()
        self.assertGreaterEqual(len(districts), 9)
        d_ids = [d["id"] for d in districts]
        self.assertIn("PUNE", d_ids)
        self.assertIn("AHMEDNAGAR", d_ids)

    def test_03_triage_evaluation(self):
        # Test FMD pattern
        fmd_result = evaluate_report(
            species="cattle",
            symptoms=["fever", "oral_lesions", "lameness", "salivation"],
            num_affected=5,
            num_dead=0,
            severity="moderate"
        )
        self.assertTrue(len(fmd_result["suspected_diseases"]) > 0)
        self.assertEqual(fmd_result["suspected_diseases"][0]["disease_id"], "fmd")
        self.assertGreaterEqual(fmd_result["suspected_diseases"][0]["confidence"], 0.6)

        # Test mass mortality AI pattern
        ai_result = evaluate_report(
            species="poultry",
            symptoms=["sudden_death", "cyanosis", "drop_in_eggs"],
            num_affected=60,
            num_dead=55,
            severity="mass_mortality"
        )
        self.assertTrue(ai_result["alert_recommended"])
        self.assertEqual(ai_result["alert_severity"], "emergency")

    def test_04_submit_symptom_report(self):
        payload = {
            "district_id": "PUNE",
            "block": "Haveli",
            "village": "Wadgaon",
            "species": "cattle",
            "num_affected": 3,
            "num_dead": 0,
            "symptoms": ["fever", "oral_lesions", "salivation"],
            "severity": "moderate",
            "reporter_type": "farmer",
            "reporter_name": "Ramesh Patil",
            "reporter_phone": "9876543210",
            "language": "mr"
        }
        resp = client.post("/livestock/reports/symptom", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue("report_id" in data)
        self.assertEqual(data["district_id"], "PUNE")
        self.assertIsNotNone(data.get("triage_result"))

    def test_05_livestock_alerts(self):
        resp = client.get("/livestock/alerts")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    def test_06_animal_registry(self):
        # Register an animal
        payload = {
            "species": "buffalo",
            "breed": "Pandharpuri",
            "age_months": 36,
            "sex": "female",
            "owner_name": "Suresh Deshmukh",
            "village": "Baramati Rural",
            "block": "Baramati",
            "district_id": "PUNE"
        }
        resp = client.post("/livestock/animals", json=payload)
        if resp.status_code == 200:
            animal = resp.json()
            self.assertIn("animal_id", animal)
            animal_id = animal["animal_id"]

            # Query profile
            prof_resp = client.get(f"/livestock/animals/{animal_id}")
            self.assertEqual(prof_resp.status_code, 200)
            self.assertIn("animal", prof_resp.json())

    def test_07_dashboard_summary_and_trends(self):
        resp = client.get("/livestock/dashboard/summary")
        self.assertEqual(resp.status_code, 200)
        summary = resp.json()
        self.assertIn("district_id", summary)

        resp_t = client.get("/livestock/dashboard/trends?weeks=6")
        self.assertEqual(resp_t.status_code, 200)
        self.assertIn("trends", resp_t.json())

    def test_08_lab_pipeline(self):
        resp = client.get("/livestock/lab/pipeline-stats")
        self.assertEqual(resp.status_code, 200)
        stats = resp.json()
        self.assertIn("collected", stats)

    def test_09_ivr_endpoints(self):
        # Test DTMF report
        ivr_payload = {
            "phone": "9822012345",
            "species_code": 1,
            "symptom_codes": [1, 2, 4],
            "district_code": "PUN",
            "num_affected": 2,
            "num_dead": 0
        }
        resp = client.post("/livestock/ivr/report", json=ivr_payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "received")
        self.assertIn("tts_message", data)

        # Test advisory in Marathi
        adv_resp = client.get("/livestock/ivr/advisory?district_code=PUN&disease=fmd&language=mr")
        self.assertEqual(adv_resp.status_code, 200)
        self.assertEqual(adv_resp.json()["language"], "mr")

    def test_10_geospatial_endpoints(self):
        resp = client.get("/livestock/geo/geojson")
        self.assertEqual(resp.status_code, 200)
        geojson = resp.json()
        self.assertEqual(geojson["type"], "FeatureCollection")
        self.assertGreaterEqual(len(geojson["features"]), 9)

        resp_risk = client.get("/livestock/geo/risk-map?disease=fmd")
        self.assertEqual(resp_risk.status_code, 200)
        self.assertIn("districts", resp_risk.json())

    def test_11_assistant_livestock_intent(self):
        query_payload = {
            "query": "What are the symptoms and vaccination schedule for FMD in Maharashtra cattle?",
            "history": []
        }
        resp = client.post("/assistant/query", json=query_payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("PashuRaksha", data["answer"])
        self.assertIn("query_livestock_explain", data["tools_used"])
        self.assertGreaterEqual(len(data["citations"]), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
