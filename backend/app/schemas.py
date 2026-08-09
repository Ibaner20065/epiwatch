from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Dict, Any, Optional

class DistrictSchema(BaseModel):
    id: str
    name: str
    state: str
    lat: float
    lon: float
    population: int

    class Config:
        from_attributes = True

class ForecastPointSchema(BaseModel):
    id: int
    district_id: str
    disease: str
    week_start: date
    predicted_cases: float
    ci_lower: float
    ci_upper: float
    risk_tier: str
    model_version: str

    class Config:
        from_attributes = True

class HistoricalPointSchema(BaseModel):
    week_start: date
    cases: int
    deaths: int
    rainfall_mm: Optional[float] = None
    temp_max_c: Optional[float] = None
    humidity_pct: Optional[float] = None

class RiskResponseSchema(BaseModel):
    district_id: str
    district_name: str
    risk_by_disease: Dict[str, str]

class BacktestEventSchema(BaseModel):
    id: int
    district_id: str
    disease: str
    event_name: str
    actual_peak_week: date
    predicted_lead_weeks: float
    metrics_json: Any

    class Config:
        from_attributes = True
