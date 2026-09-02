"""
PashuRaksha / MOSPI Dataful Livestock Analytics Router
======================================================
Serves national historical incidence trends, multi-year ML forecasts (2016-2026),
model evaluation metrics, and clinical symptom triage.
"""

import os
import json
import pickle
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/livestock/dataful", tags=["Livestock MOSPI / Dataful ML"])

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
RESULTS_DIR = os.path.join(BASE_DIR, "ml", "livestock", "results")
MODELS_DIR = os.path.join(BASE_DIR, "ml", "models")


# ── Response Schemas ────────────────────────────────────────────────
class DiseaseSummaryItem(BaseModel):
    name: str
    slug: str
    total_outbreaks_2005_2015: float
    total_attacks_2005_2015: float
    total_deaths_2005_2015: float
    overall_cfr: float
    mean_annual_cfr: float
    peak_attack_year: int
    peak_attacks: float
    peak_outbreak_year: int
    peak_outbreaks: float
    trend_10yr: str
    risk_classification: str


class DatafulSummaryResponse(BaseModel):
    total_diseases: int
    total_outbreaks_all_time: float
    total_attacks_all_time: float
    total_deaths_all_time: float
    overall_cfr: float
    models_trained: int
    average_holdout_mae: float
    forecast_range: str


class DiseaseForecastResponse(BaseModel):
    name: str
    slug: str
    historical: List[Dict[str, Any]]
    forecasts: Dict[str, List[Dict[str, Any]]]
    model_metrics: Optional[Dict[str, Any]] = None


# ── Helpers to load cached artifacts safely ─────────────────────────
def _load_json(file_path: str) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


# ── Endpoints ───────────────────────────────────────────────────────
@router.get("/summary", response_model=DatafulSummaryResponse)
def get_dataful_summary():
    """Returns top-level KPIs for the MOSPI / Dataful livestock dataset and ML models."""
    summary_path = os.path.join(RESULTS_DIR, "dataful_training_summary.json")
    disease_summary_path = os.path.join(PROCESSED_DIR, "dataful_disease_summary.json")

    summary_data = _load_json(summary_path)
    diseases = _load_json(disease_summary_path)

    total_outbreaks = sum(d.get("total_outbreaks_2005_2015", 0.0) for d in diseases.values())
    total_attacks = sum(d.get("total_attacks_2005_2015", 0.0) for d in diseases.values())
    total_deaths = sum(d.get("total_deaths_2005_2015", 0.0) for d in diseases.values())
    overall_cfr = round(total_deaths / total_attacks, 4) if total_attacks > 0 else 0.0

    return DatafulSummaryResponse(
        total_diseases=len(diseases),
        total_outbreaks_all_time=total_outbreaks,
        total_attacks_all_time=total_attacks,
        total_deaths_all_time=total_deaths,
        overall_cfr=overall_cfr,
        models_trained=summary_data.get("total_models_saved", len(diseases) * 3),
        average_holdout_mae=summary_data.get("average_holdout_mae", 0.0),
        forecast_range=summary_data.get("forecast_horizons", "2016 - 2026 (11 years)"),
    )


@router.get("/diseases")
def get_all_diseases():
    """Returns all 37 livestock diseases with 10-year summary statistics and risk tiers."""
    disease_summary_path = os.path.join(PROCESSED_DIR, "dataful_disease_summary.json")
    diseases = _load_json(disease_summary_path)
    if not diseases:
        raise HTTPException(status_code=404, detail="Disease summary data not found")
    return list(diseases.values())


@router.get("/trends/{disease_slug}", response_model=DiseaseForecastResponse)
def get_disease_forecast(disease_slug: str):
    """
    Returns historical data (2005-2015) and ML forecasted trajectory (2016-2026)
    with confidence bounds for the specified disease.
    """
    forecasts_path = os.path.join(RESULTS_DIR, "dataful_forecasts_2016_2026.json")
    metrics_path = os.path.join(RESULTS_DIR, "dataful_model_metrics.json")

    all_forecasts = _load_json(forecasts_path)
    all_metrics = _load_json(metrics_path)

    slug = disease_slug.lower()
    if slug not in all_forecasts:
        # Check if slug matches without underscores
        matched_slug = next((k for k in all_forecasts.keys() if k == slug or k.replace("_", "") == slug.replace("_", "")), None)
        if not matched_slug:
            raise HTTPException(status_code=404, detail=f"Disease '{disease_slug}' not found in forecasts")
        slug = matched_slug

    fc_data = all_forecasts[slug]
    metrics_data = all_metrics.get(slug, {}).get("targets", {})

    return DiseaseForecastResponse(
        name=fc_data["name"],
        slug=fc_data["slug"],
        historical=fc_data["historical"],
        forecasts=fc_data["forecasts"],
        model_metrics=metrics_data,
    )


@router.get("/metrics")
def get_model_metrics():
    """Returns holdout performance metrics (MAE, RMSE, MAPE) across all 37 disease models."""
    metrics_path = os.path.join(RESULTS_DIR, "dataful_model_metrics.json")
    summary_path = os.path.join(RESULTS_DIR, "dataful_training_summary.json")

    metrics = _load_json(metrics_path)
    summary = _load_json(summary_path)

    return {
        "summary": summary,
        "disease_metrics": metrics
    }


@router.get("/triage")
def symptom_triage_inference(symptoms: str = Query(..., description="Comma-separated or natural language symptoms")):
    """
    Predicts suspected diseases and clinical severity grading using the trained NLP / Gradient Boosted model.
    """
    model_path = os.path.join(MODELS_DIR, "symptom_triage_model.pkl")
    if not os.path.exists(model_path):
        raise HTTPException(status_code=503, detail="Symptom triage model not yet trained or available")

    try:
        with open(model_path, "rb") as f:
            bundle = pickle.load(f)

        vec = bundle["vectorizer"].transform([symptoms])
        dis_prob = bundle["disease_classifier"].predict_proba(vec)[0]
        disease_classes = bundle["disease_classes"]

        top_indices = (-dis_prob).argsort()[:5]
        top_diseases = [
            {"disease": disease_classes[i], "confidence": round(float(dis_prob[i]), 3)}
            for i in top_indices if dis_prob[i] > 0.02
        ]

        sev_idx = bundle["severity_classifier"].predict(vec)[0]
        sev_label = bundle["severity_encoder"].inverse_transform([sev_idx])[0]

        return {
            "symptoms_input": symptoms,
            "predicted_severity": sev_label,
            "suspected_diseases": top_diseases
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
