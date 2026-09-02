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


# ── SwasthSandhi OA Screening Schemas (SIH26004) ──────────────

class OAPatientCreateSchema(BaseModel):
    patient_id: Optional[str] = None
    age: int
    sex: str
    bmi: float
    occupation: str
    occupation_detail: Optional[str] = None
    activity_level: Optional[int] = 1
    prior_joint_injury: Optional[bool] = False
    family_history_oa: Optional[bool] = False
    diabetes: Optional[bool] = False
    terrain_factor: Optional[float] = 1.0
    ner_district: str
    language: Optional[str] = "en"
    recorded_by: Optional[str] = None

    class Config:
        from_attributes = True

class OAPatientSchema(BaseModel):
    id: int
    patient_id: str
    age: int
    sex: str
    bmi: float
    occupation: str
    occupation_detail: Optional[str] = None
    activity_level: Optional[int] = 1
    prior_joint_injury: Optional[bool] = False
    family_history_oa: Optional[bool] = False
    diabetes: Optional[bool] = False
    terrain_factor: Optional[float] = 1.0
    ner_district: str
    language: Optional[str] = "en"
    recorded_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OAScreeningCreateSchema(BaseModel):
    womac_pain: float
    womac_stiffness: float
    womac_function: float
    joint_knee: Optional[bool] = False
    joint_hip: Optional[bool] = False
    joint_hand: Optional[bool] = False
    joint_spine: Optional[bool] = False
    crepitus: Optional[bool] = False
    joint_swelling: Optional[bool] = False
    morning_stiffness_min: Optional[int] = 0
    offline_synced: Optional[bool] = False

    class Config:
        from_attributes = True

class OAScreeningSchema(BaseModel):
    id: int
    patient_id: str
    screened_at: datetime
    womac_pain: float
    womac_stiffness: float
    womac_function: float
    womac_total: float
    joint_knee: Optional[bool] = False
    joint_hip: Optional[bool] = False
    joint_hand: Optional[bool] = False
    joint_spine: Optional[bool] = False
    crepitus: Optional[bool] = False
    joint_swelling: Optional[bool] = False
    morning_stiffness_min: Optional[int] = 0
    risk_probability: float
    risk_tier: str
    risk_source: str
    severity_note: Optional[str] = None
    referral_required: Optional[bool] = False
    report_pdf_ref: Optional[str] = None
    offline_synced: Optional[bool] = False

    class Config:
        from_attributes = True

class OARiskResponseSchema(BaseModel):
    patient_id: str
    risk_probability: float
    risk_tier: str
    risk_source: str
    top_factors: List[Dict[str, Any]]
    severity_note: Optional[str] = None
    referral_required: bool
    disclaimer: str
