"""
PashuRaksha — Livestock SQLAlchemy ORM Models
=============================================
Data models for animal-health surveillance aligned with Maharashtra
Dept. of Animal Husbandry, Dairy Development & Fisheries.

Tables:
  livestock_districts    — Maharashtra district + livestock census metadata
  symptom_reports        — field-level symptom/mortality reports
  mortality_events       — aggregated mortality events
  animal_records         — individual animal/herd records
  vaccination_records    — per-animal vaccination history
  treatment_records      — per-animal treatment history
  lab_samples            — sample collection → lab referral → result
  livestock_alerts       — auto-generated triage alerts
  livestock_advisories   — multilingual advisories issued to farmers
"""

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, JSON,
    ForeignKey, Boolean, Text, Enum as SAEnum,
)
from sqlalchemy.orm import declarative_base
import enum

# Re-use existing Base if imported from models, otherwise standalone
try:
    from .models import Base
except Exception:
    Base = declarative_base()


# ── Enums ───────────────────────────────────────────────────────────

class SpeciesEnum(str, enum.Enum):
    cattle = "cattle"
    buffalo = "buffalo"
    goat = "goat"
    sheep = "sheep"
    poultry = "poultry"


class SeverityEnum(str, enum.Enum):
    mild = "mild"
    moderate = "moderate"
    severe = "severe"
    mass_mortality = "mass_mortality"


class AlertSeverity(str, enum.Enum):
    watch = "watch"
    warning = "warning"
    outbreak = "outbreak"
    emergency = "emergency"


class AlertStatus(str, enum.Enum):
    active = "active"
    acknowledged = "acknowledged"
    resolved = "resolved"


class SampleStatus(str, enum.Enum):
    collected = "collected"
    in_transit = "in_transit"
    received = "received"
    testing = "testing"
    result_available = "result_available"


class ReporterType(str, enum.Enum):
    farmer = "farmer"
    para_vet = "para_vet"
    field_vet = "field_vet"
    livestock_inspector = "livestock_inspector"
    panchayat_member = "panchayat_member"


# ── District ────────────────────────────────────────────────────────

class LivestockDistrict(Base):
    """Maharashtra district with livestock census metadata."""
    __tablename__ = "livestock_districts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False, default="Maharashtra")
    division = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    cattle_population = Column(Integer, default=0)
    buffalo_population = Column(Integer, default=0)
    goat_population = Column(Integer, default=0)
    sheep_population = Column(Integer, default=0)
    poultry_population = Column(Integer, default=0)
    total_livestock = Column(Integer, default=0)
    taluka_vet_dispensaries = Column(Integer, default=0)
    mobile_vet_clinics = Column(Integer, default=0)
    disease_diagnostic_lab = Column(Boolean, default=False)
    ai_centres = Column(Integer, default=0)


# ── Symptom Report ──────────────────────────────────────────────────

class SymptomReport(Base):
    """Individual field-level symptom/mortality report from farmer or vet."""
    __tablename__ = "symptom_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(String, unique=True, index=True, nullable=False)
    district_id = Column(String, ForeignKey("livestock_districts.id"), nullable=False)
    block = Column(String, nullable=False)
    village = Column(String, nullable=False)
    species = Column(String, nullable=False)        # cattle|buffalo|goat|sheep|poultry
    breed = Column(String, nullable=True)
    num_affected = Column(Integer, default=1)
    num_dead = Column(Integer, default=0)
    # Symptom checklist (stored as JSON array of symptom codes)
    symptoms = Column(JSON, nullable=False)          # ["fever","oral_lesions","lameness",...]
    severity = Column(String, default="moderate")    # mild|moderate|severe|mass_mortality
    suspected_disease = Column(String, nullable=True)
    description = Column(Text, nullable=True)        # free-text from reporter
    reporter_type = Column(String, default="farmer")
    reporter_name = Column(String, nullable=True)
    reporter_phone = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    photo_urls = Column(JSON, nullable=True)         # array of photo URLs
    animal_id = Column(String, nullable=True)        # optional link to animal_records
    reported_at = Column(DateTime, nullable=False)
    offline_synced = Column(Boolean, default=False)
    triage_result = Column(JSON, nullable=True)      # auto-filled by triage engine
    language = Column(String, default="en")


# ── Mortality Event ─────────────────────────────────────────────────

class MortalityEvent(Base):
    """Aggregated mortality event (mass die-off or elevated mortality)."""
    __tablename__ = "mortality_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(String, unique=True, index=True, nullable=False)
    district_id = Column(String, ForeignKey("livestock_districts.id"), nullable=False)
    block = Column(String, nullable=False)
    village = Column(String, nullable=False)
    species = Column(String, nullable=False)
    num_dead = Column(Integer, nullable=False)
    suspected_cause = Column(String, nullable=True)
    reported_by = Column(String, nullable=True)
    reporter_phone = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    verified_by = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    reported_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=True)


# ── Animal Record ──────────────────────────────────────────────────

class AnimalRecord(Base):
    """Individual animal or herd-level health record."""
    __tablename__ = "animal_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    animal_id = Column(String, unique=True, index=True, nullable=False)
    ear_tag = Column(String, nullable=True, index=True)
    species = Column(String, nullable=False)
    breed = Column(String, nullable=True)
    age_months = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)              # male|female
    owner_id = Column(String, nullable=True, index=True)
    owner_name = Column(String, nullable=True)
    village = Column(String, nullable=True)
    block = Column(String, nullable=True)
    district_id = Column(String, ForeignKey("livestock_districts.id"), nullable=False)
    state = Column(String, default="Maharashtra")
    registered_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)        # False if dead or sold


# ── Vaccination Record ─────────────────────────────────────────────

class VaccinationRecord(Base):
    """Per-animal vaccination event."""
    __tablename__ = "vaccination_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    animal_id = Column(String, ForeignKey("animal_records.animal_id"), nullable=False, index=True)
    vaccine_name = Column(String, nullable=False)
    disease_target = Column(String, nullable=False)  # fmd|lsd|ppr|brucellosis|ai_h5n1
    batch_number = Column(String, nullable=True)
    administered_by = Column(String, nullable=True)  # vet ID or name
    administered_at = Column(DateTime, nullable=False)
    next_due = Column(Date, nullable=True)
    district_id = Column(String, nullable=True)
    block = Column(String, nullable=True)
    campaign_name = Column(String, nullable=True)    # e.g. "NADCP FMD Round 23"


# ── Treatment Record ──────────────────────────────────────────────

class TreatmentRecord(Base):
    """Per-animal treatment event."""
    __tablename__ = "treatment_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    animal_id = Column(String, ForeignKey("animal_records.animal_id"), nullable=False, index=True)
    diagnosis = Column(String, nullable=False)
    symptoms_observed = Column(JSON, nullable=True)
    drugs_administered = Column(JSON, nullable=True) # [{"drug": "...", "dose": "...", "route": "..."}]
    outcome = Column(String, nullable=True)          # recovered|improving|died|referred
    treated_by = Column(String, nullable=True)       # vet ID
    treated_at = Column(DateTime, nullable=False)
    follow_up_date = Column(Date, nullable=True)
    district_id = Column(String, nullable=True)


# ── Lab Sample ─────────────────────────────────────────────────────

class LabSample(Base):
    """Sample collection → lab referral → result tracking."""
    __tablename__ = "lab_samples"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sample_id = Column(String, unique=True, index=True, nullable=False)
    report_id = Column(String, nullable=True, index=True)    # link to symptom_report
    animal_id = Column(String, nullable=True)
    sample_type = Column(String, nullable=False)     # blood|serum|swab|tissue|faecal
    species = Column(String, nullable=True)
    suspected_disease = Column(String, nullable=True)
    collected_by = Column(String, nullable=True)
    collection_date = Column(DateTime, nullable=False)
    lab_id = Column(String, nullable=True)           # target lab identifier
    lab_name = Column(String, nullable=True)
    status = Column(String, default="collected")     # collected|in_transit|received|testing|result_available
    result = Column(String, nullable=True)           # positive|negative|inconclusive
    pathogen_identified = Column(String, nullable=True)
    result_date = Column(DateTime, nullable=True)
    district_id = Column(String, nullable=True)
    block = Column(String, nullable=True)
    notes = Column(Text, nullable=True)


# ── Alert ──────────────────────────────────────────────────────────

class LivestockAlert(Base):
    """System-generated triage alert."""
    __tablename__ = "livestock_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alert_id = Column(String, unique=True, index=True, nullable=False)
    alert_type = Column(String, nullable=False)      # cluster_outbreak|mortality_spike|disease_confirmed|vaccination_gap
    severity = Column(String, default="watch")       # watch|warning|outbreak|emergency
    status = Column(String, default="active")        # active|acknowledged|resolved
    district_id = Column(String, ForeignKey("livestock_districts.id"), nullable=False)
    block = Column(String, nullable=True)
    village = Column(String, nullable=True)
    disease = Column(String, nullable=True)
    species = Column(String, nullable=True)
    message_en = Column(Text, nullable=False)
    message_hi = Column(Text, nullable=True)
    message_mr = Column(Text, nullable=True)         # Marathi for Maharashtra
    triggered_by_report_id = Column(String, nullable=True)
    triggered_at = Column(DateTime, nullable=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    details_json = Column(JSON, nullable=True)       # supporting data for the alert


# ── Advisory ───────────────────────────────────────────────────────

class LivestockAdvisory(Base):
    """Multilingual advisory issued to farmers/field workers."""
    __tablename__ = "livestock_advisories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    advisory_id = Column(String, unique=True, index=True, nullable=False)
    district_id = Column(String, ForeignKey("livestock_districts.id"), nullable=True)
    disease = Column(String, nullable=True)
    species = Column(String, nullable=True)
    title_en = Column(String, nullable=False)
    title_hi = Column(String, nullable=True)
    title_mr = Column(String, nullable=True)
    body_en = Column(Text, nullable=False)
    body_hi = Column(Text, nullable=True)
    body_mr = Column(Text, nullable=True)
    severity = Column(String, default="info")        # info|caution|urgent
    issued_by = Column(String, nullable=True)        # official name or dept
    issued_at = Column(DateTime, nullable=False)
    valid_until = Column(Date, nullable=True)
    target_audience = Column(String, default="all")  # farmer|para_vet|official|all


# ── Maharashtra Tehsil Census ──────────────────────────────────────

class MaharashtraTehsilCensus(Base):
    """Tehsil/Block-level 19th Livestock & Poultry Census for Maharashtra."""
    __tablename__ = "maharashtra_tehsil_livestock_census"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sr_no = Column(Integer, nullable=True)
    district_name = Column(String, nullable=False, index=True)
    district_id = Column(String, ForeignKey("livestock_districts.id"), nullable=True, index=True)
    tehsil_name = Column(String, nullable=False, index=True)
    cattle_exotic = Column(Integer, default=0)
    cattle_indigenous = Column(Integer, default=0)
    cattle_total = Column(Integer, default=0)
    buffaloes_total = Column(Integer, default=0)
    sheep_exotic = Column(Integer, default=0)
    sheep_indigenous = Column(Integer, default=0)
    sheep_total = Column(Integer, default=0)
    goats_total = Column(Integer, default=0)
    pigs_exotic = Column(Integer, default=0)
    pigs_indigenous = Column(Integer, default=0)
    pigs_total = Column(Integer, default=0)
    horses_ponies_total = Column(Integer, default=0)
    mules_total = Column(Integer, default=0)
    donkeys_total = Column(Integer, default=0)
    camels_total = Column(Integer, default=0)
    total_livestock = Column(Integer, default=0)
    dogs_total = Column(Integer, default=0)
    rabbits_total = Column(Integer, default=0)
    elephants_total = Column(Integer, default=0)
    poultry_fowls = Column(Integer, default=0)
    poultry_ducks = Column(Integer, default=0)
    poultry_turkeys = Column(Integer, default=0)
    poultry_quails = Column(Integer, default=0)
    poultry_other = Column(Integer, default=0)
    poultry_backyard_total = Column(Integer, default=0)
    poultry_commercial_total = Column(Integer, default=0)
    total_poultry_birds = Column(Integer, default=0)

