"""
PashuRaksha — Pydantic Schemas for Livestock Endpoints
======================================================
Request/response schemas for all livestock API endpoints.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Dict, Any, Optional


# ── District ────────────────────────────────────────────────────────

class LivestockDistrictSchema(BaseModel):
    id: str
    name: str
    state: str = "Maharashtra"
    division: Optional[str] = None
    lat: float
    lon: float
    cattle_population: int = 0
    buffalo_population: int = 0
    goat_population: int = 0
    sheep_population: int = 0
    poultry_population: int = 0
    total_livestock: int = 0
    taluka_vet_dispensaries: int = 0
    mobile_vet_clinics: int = 0
    disease_diagnostic_lab: bool = False

    class Config:
        from_attributes = True


# ── Symptom Report ──────────────────────────────────────────────────

class SymptomReportCreate(BaseModel):
    district_id: str
    block: str
    village: str
    species: str                             # cattle|buffalo|goat|sheep|poultry
    breed: Optional[str] = None
    num_affected: int = 1
    num_dead: int = 0
    symptoms: List[str]                      # ["fever","oral_lesions","lameness",...]
    severity: str = "moderate"               # mild|moderate|severe|mass_mortality
    suspected_disease: Optional[str] = None
    description: Optional[str] = None
    reporter_type: str = "farmer"
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    photo_urls: Optional[List[str]] = None
    animal_id: Optional[str] = None
    language: str = "en"
    offline_synced: bool = False


class SymptomReportSchema(BaseModel):
    id: int
    report_id: str
    district_id: str
    block: str
    village: str
    species: str
    breed: Optional[str] = None
    num_affected: int
    num_dead: int
    symptoms: List[str]
    severity: str
    suspected_disease: Optional[str] = None
    description: Optional[str] = None
    reporter_type: str
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    photo_urls: Optional[List[str]] = None
    animal_id: Optional[str] = None
    reported_at: datetime
    offline_synced: bool = False
    triage_result: Optional[Dict[str, Any]] = None
    language: str = "en"

    class Config:
        from_attributes = True


class BatchSyncRequest(BaseModel):
    reports: List[SymptomReportCreate]


class BatchSyncResponse(BaseModel):
    synced: int
    failed: int
    report_ids: List[str]
    errors: List[str] = []


# ── Mortality Event ─────────────────────────────────────────────────

class MortalityEventCreate(BaseModel):
    district_id: str
    block: str
    village: str
    species: str
    num_dead: int
    suspected_cause: Optional[str] = None
    reported_by: Optional[str] = None
    reporter_phone: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class MortalityEventSchema(BaseModel):
    id: int
    event_id: str
    district_id: str
    block: str
    village: str
    species: str
    num_dead: int
    suspected_cause: Optional[str] = None
    reported_by: Optional[str] = None
    verified: bool
    reported_at: datetime

    class Config:
        from_attributes = True


# ── Animal Record ──────────────────────────────────────────────────

class AnimalRecordCreate(BaseModel):
    ear_tag: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    sex: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    village: Optional[str] = None
    block: Optional[str] = None
    district_id: str


class AnimalRecordSchema(BaseModel):
    id: int
    animal_id: str
    ear_tag: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    sex: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    village: Optional[str] = None
    block: Optional[str] = None
    district_id: str
    state: str = "Maharashtra"
    registered_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True


class AnimalProfileSchema(BaseModel):
    """Full animal profile with vaccination + treatment history."""
    animal: AnimalRecordSchema
    vaccinations: List[Dict[str, Any]] = []
    treatments: List[Dict[str, Any]] = []
    lab_samples: List[Dict[str, Any]] = []


# ── Vaccination Record ─────────────────────────────────────────────

class VaccinationRecordCreate(BaseModel):
    vaccine_name: str
    disease_target: str                      # fmd|lsd|ppr|brucellosis|ai_h5n1
    batch_number: Optional[str] = None
    administered_by: Optional[str] = None
    next_due: Optional[date] = None
    district_id: Optional[str] = None
    block: Optional[str] = None
    campaign_name: Optional[str] = None


class VaccinationRecordSchema(BaseModel):
    id: int
    animal_id: str
    vaccine_name: str
    disease_target: str
    batch_number: Optional[str] = None
    administered_by: Optional[str] = None
    administered_at: datetime
    next_due: Optional[date] = None
    campaign_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Treatment Record ──────────────────────────────────────────────

class TreatmentRecordCreate(BaseModel):
    diagnosis: str
    symptoms_observed: Optional[List[str]] = None
    drugs_administered: Optional[List[Dict[str, str]]] = None
    outcome: Optional[str] = None            # recovered|improving|died|referred
    treated_by: Optional[str] = None
    follow_up_date: Optional[date] = None
    district_id: Optional[str] = None


class TreatmentRecordSchema(BaseModel):
    id: int
    animal_id: str
    diagnosis: str
    symptoms_observed: Optional[List[str]] = None
    drugs_administered: Optional[List[Dict[str, str]]] = None
    outcome: Optional[str] = None
    treated_by: Optional[str] = None
    treated_at: datetime
    follow_up_date: Optional[date] = None

    class Config:
        from_attributes = True


# ── Lab Sample ─────────────────────────────────────────────────────

class LabSampleCreate(BaseModel):
    report_id: Optional[str] = None
    animal_id: Optional[str] = None
    sample_type: str                         # blood|serum|swab|tissue|faecal
    species: Optional[str] = None
    suspected_disease: Optional[str] = None
    collected_by: Optional[str] = None
    lab_id: Optional[str] = None
    lab_name: Optional[str] = None
    district_id: Optional[str] = None
    block: Optional[str] = None
    notes: Optional[str] = None


class LabSampleStatusUpdate(BaseModel):
    status: str                              # in_transit|received|testing|result_available


class LabSampleResultUpdate(BaseModel):
    result: str                              # positive|negative|inconclusive
    pathogen_identified: Optional[str] = None
    notes: Optional[str] = None


class LabSampleSchema(BaseModel):
    id: int
    sample_id: str
    report_id: Optional[str] = None
    animal_id: Optional[str] = None
    sample_type: str
    species: Optional[str] = None
    suspected_disease: Optional[str] = None
    collected_by: Optional[str] = None
    collection_date: datetime
    lab_id: Optional[str] = None
    lab_name: Optional[str] = None
    status: str
    result: Optional[str] = None
    pathogen_identified: Optional[str] = None
    result_date: Optional[datetime] = None
    district_id: Optional[str] = None
    block: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ── Alert ──────────────────────────────────────────────────────────

class LivestockAlertSchema(BaseModel):
    id: int
    alert_id: str
    alert_type: str
    severity: str
    status: str
    district_id: str
    block: Optional[str] = None
    village: Optional[str] = None
    disease: Optional[str] = None
    species: Optional[str] = None
    message_en: str
    message_hi: Optional[str] = None
    message_mr: Optional[str] = None
    triggered_at: datetime
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    details_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str


# ── Advisory ───────────────────────────────────────────────────────

class LivestockAdvisorySchema(BaseModel):
    id: int
    advisory_id: str
    district_id: Optional[str] = None
    disease: Optional[str] = None
    species: Optional[str] = None
    title_en: str
    title_hi: Optional[str] = None
    title_mr: Optional[str] = None
    body_en: str
    body_hi: Optional[str] = None
    body_mr: Optional[str] = None
    severity: str = "info"
    issued_by: Optional[str] = None
    issued_at: datetime
    valid_until: Optional[date] = None
    target_audience: str = "all"

    class Config:
        from_attributes = True


class AdvisoryBroadcastRequest(BaseModel):
    district_id: str
    disease: Optional[str] = None
    species: Optional[str] = None
    title_en: str
    title_hi: Optional[str] = None
    title_mr: Optional[str] = None
    body_en: str
    body_hi: Optional[str] = None
    body_mr: Optional[str] = None
    severity: str = "info"
    issued_by: Optional[str] = None
    target_audience: str = "all"


# ── Dashboard ──────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    district_id: str
    district_name: str
    total_reports_this_week: int = 0
    active_alerts: int = 0
    vaccination_coverage_pct: float = 0.0
    mortality_rate: float = 0.0
    pending_lab_samples: int = 0
    total_animals_registered: int = 0
    diseases_active: List[str] = []


class DashboardTrendPoint(BaseModel):
    week_start: str
    reported_cases: int
    deaths: int
    alerts: int


# ── IVR ────────────────────────────────────────────────────────────

class IVRReportRequest(BaseModel):
    """Simplified report for IVR/DTMF-based input."""
    phone: str
    species_code: int                        # 1=cattle,2=buffalo,3=goat,4=sheep,5=poultry
    symptom_codes: List[int]                 # numeric codes for symptoms
    village_code: Optional[str] = None
    district_code: Optional[str] = None
    num_affected: int = 1
    num_dead: int = 0


class IVRAdvisoryResponse(BaseModel):
    """TTS-friendly advisory response."""
    language: str
    advisory_text: str
    disease_risk: str
    district_name: str
