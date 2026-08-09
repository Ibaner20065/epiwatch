from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict
from ..db import engine
from ..models import District, Prediction, CaseData, ClimateData
from ..schemas import ForecastPointSchema, HistoricalPointSchema, RiskResponseSchema

router = APIRouter(prefix="/districts", tags=["Predictions"])

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
