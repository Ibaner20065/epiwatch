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
    census_year: Optional[int] = None
    population_density_km2: Optional[float] = None
    sanitation_index: Optional[float] = None
    water_body_proximity_score: Optional[float] = None
    vaccination_coverage_pct: Optional[float] = None
    urbanization_pct: Optional[float] = None

    class Config:
        from_attributes = True

class PrecautionSchema(BaseModel):
    disease_id: str
    individual_precautions: Optional[List[str]] = None
    community_precautions: Optional[List[str]] = None
    early_warning_symptoms: Optional[List[str]] = None
    high_risk_groups: Optional[List[str]] = None
    govt_helpline: Optional[str] = None
    seasonal_window: Optional[str] = None

    class Config:
        from_attributes = True

class GovtSchemeSchema(BaseModel):
    disease_id: str
    scheme_name: str
    covering_body: str
    max_coverage_amount: Optional[str] = None
    eligibility_summary: Optional[str] = None
    application_link: Optional[str] = None
    helpline: Optional[str] = None

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

class ForecastRunSchema(BaseModel):
    id: int
    district_id: str
    disease: str
    horizon_type: str
    regime: str
    forecast_start: date
    forecast_end: date
    cutoff_date: Optional[date] = None
    predicted_curve: Any
    confidence_lower: Any
    confidence_upper: Any
    climate_input_method: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    notes: Optional[str] = None
    computed_at: datetime

    class Config:
        from_attributes = True
