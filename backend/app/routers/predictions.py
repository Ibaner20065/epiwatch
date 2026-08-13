from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os, json
from ..db import engine
from ..models import District, Prediction, CaseData, ClimateData
from ..schemas import ForecastPointSchema, HistoricalPointSchema, RiskResponseSchema

router = APIRouter(prefix="/districts", tags=["Predictions"])

_shap_cache: Dict[str, Any] = {}

def _load_shap():
    if _shap_cache:
        return _shap_cache
    shap_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "results", "shap_importance.json")
    if os.path.exists(shap_path):
        with open(shap_path) as f:
            _shap_cache.update(json.load(f))
    return _shap_cache

def get_db():
    with Session(engine) as session:
        yield session

@router.get("/{district_id}/forecast", response_model=List[ForecastPointSchema])
def get_forecast(district_id: str, disease: str = Query("dengue"), db: Session = Depends(get_db)):
    d_id = district_id.upper()
    preds = (
        db.query(Prediction)
        .filter(Prediction.district_id == d_id, Prediction.disease == disease.lower())
        .order_by(Prediction.week_start.asc())
        .all()
    )
    if not preds:
        raise HTTPException(status_code=404, detail=f"No forecast found for district '{district_id}' and disease '{disease}'")
    return preds

@router.get("/{district_id}/history", response_model=List[HistoricalPointSchema])
def get_history(district_id: str, disease: str = Query("dengue"), db: Session = Depends(get_db)):
    d_id = district_id.upper()
    cases = (
        db.query(CaseData)
        .filter(CaseData.district_id == d_id, CaseData.disease == disease.lower())
        .order_by(CaseData.week_start.asc())
        .all()
    )
    if not cases:
        raise HTTPException(status_code=404, detail=f"No historical case data found for district '{district_id}' and disease '{disease}'")
    
    climate = (
        db.query(ClimateData)
        .filter(ClimateData.district_id == d_id)
        .all()
    )
    climate_map = {c.week_start: c for c in climate}
    
    result = []
    for c in cases:
        clim = climate_map.get(c.week_start)
        result.append(HistoricalPointSchema(
            week_start=c.week_start,
            cases=c.cases,
            deaths=c.deaths,
            rainfall_mm=clim.rainfall_mm if clim else None,
            temp_max_c=clim.temp_max_c if clim else None,
            humidity_pct=clim.humidity_pct if clim else None
        ))
    return result

@router.get("/{district_id}/risk", response_model=RiskResponseSchema)
def get_risk(district_id: str, db: Session = Depends(get_db)):
    d_id = district_id.upper()
    d = db.query(District).filter(District.id == d_id).first()
    if not d:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found")
        
    preds = db.query(Prediction).filter(Prediction.district_id == d_id).all()
    risk_by_dis: Dict[str, str] = {}
    for p in preds:
        if p.disease not in risk_by_dis:
            risk_by_dis[p.disease] = p.risk_tier
            
    return RiskResponseSchema(
        district_id=d.id,
        district_name=d.name,
        risk_by_disease=risk_by_dis
    )

@router.get("/{district_id}/shap")
def get_shap_importance(district_id: str, disease: str = Query("dengue")):
    """Return SHAP feature importance weights for a specific district and disease."""
    d_id = district_id.upper()
    dis = disease.lower()
    key = f"{d_id}_{dis}"
    
    shap_data = _load_shap()
    if key not in shap_data:
        raise HTTPException(status_code=404, detail=f"No SHAP data for district '{d_id}' and disease '{dis}'")
    
    raw = shap_data[key]
    # Sort by importance descending and format as readable list
    sorted_features = sorted(raw.items(), key=lambda x: x[1], reverse=True)
    
    FEATURE_LABELS = {
        "rainfall_mm": "Rainfall (Current Week)",
        "temp_max_c": "Maximum Temperature",
        "humidity_pct": "Relative Humidity (RH2M)",
        "rainfall_lag2": "Rainfall (2-Week Lag)",
        "temp_max_lag1": "Max Temperature (1-Week Lag)",
        "humidity_lag1": "Humidity (1-Week Lag)",
    }
    
    features = []
    for feat, val in sorted_features:
        features.append({
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "importance": round(val, 4),
            "percentage": round(val * 100, 1)
        })
    
    return {
        "district_id": d_id,
        "disease": dis,
        "features": features
    }
