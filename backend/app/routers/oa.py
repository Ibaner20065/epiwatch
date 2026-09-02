"""SwasthSandhi OA Screening API router (SIH26004 — MDoNER).

Exposes the Osteoarthritis early-detection workflow:
  - POST /oa/screening      submit a screening, get ML risk + tier
  - GET  /oa/patients       list patients (dashboard)
  - GET  /oa/patient/{id}   patient record + screening history
  - GET  /oa/risk-summary   aggregate analytics for district dashboards
  - GET  /oa/ner-regions    NER districts + languages (multilingual UI)
  - GET  /oa/model-status   ML model availability + holdout metrics
  - GET  /oa/clinical-rules transparent rules-baseline tiers (audit)

DB persistence mirrors the repo's resilient pattern: write attempts are
isolated so the risk-scoring core always works even if Supabase is reachable
but the OA tables have not yet been created/seeded (offline demo safety).
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, create_engine
from typing import List, Dict, Any, Optional
import os, json, datetime
from ..db import engine, config
from ..models import OAPatient, OAScreening
from ..schemas import (
    OAPatientCreateSchema, OAScreeningCreateSchema, OAScreeningSchema, OARiskResponseSchema,
)
from ..oa_engine import score_screening, model_available

router = APIRouter(prefix="/oa", tags=["SwasthSandhi OA"])

OA_RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "oa", "results")

# Fast-fail database reachability guard. The OA module must keep serving (with
# offline persistence skipped) when the backing store is unreachable, so we do
# a cheap SELECT 1 via a throwaway short-timeout engine instead of blocking on
# the (possibly dead) shared engine's pooled connection.
_reachable_engine = None


def _probe_engine():
    global _reachable_engine
    if _reachable_engine is None and config.DATABASE_URL:
        try:
            _reachable_engine = create_engine(
                config.DATABASE_URL, pool_pre_ping=True, pool_size=1, max_overflow=0,
                connect_args={"sslmode": "require", "connect_timeout": 4},
            )
        except Exception:
            _reachable_engine = None
    return _reachable_engine


def db_reachable() -> bool:
    eng = _probe_engine()
    if eng is None:
        return False
    try:
        with eng.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return True
    except Exception:
        return False

NER_REGIONS = [
    {"code": "AS-KAMRUP", "name": "Kamrup (Metro)", "state": "Assam", "language": "as"},
    {"code": "AS-GOLAGHAT", "name": "Golaghat", "state": "Assam", "language": "as"},
    {"code": "AS-DIBRUGARH", "name": "Dibrugarh", "state": "Assam", "language": "as"},
    {"code": "AS-SONITPUR", "name": "Sonitpur", "state": "Assam", "language": "as"},
    {"code": "TL-AGARTALA", "name": "Agartala", "state": "Tripura", "language": "bn"},
    {"code": "MZ-AIZAWL", "name": "Aizawl", "state": "Mizoram", "language": "hi"},
    {"code": "NL-MOKOKCHUNG", "name": "Mokokchung", "state": "Nagaland", "language": "en"},
    {"code": "MN-UKHRUL", "name": "Ukhrul", "state": "Manipur", "language": "en"},
]

LANGUAGES = [
    {"code": "as", "name": "অসমীয়া", "name_en": "Assamese"},
    {"code": "bn", "name": "বাংলা", "name_en": "Bengali"},
    {"code": "hi", "name": "हिन्दी", "name_en": "Hindi"},
    {"code": "en", "name": "English", "name_en": "English"},
]


def get_db():
    with Session(engine) as session:
        yield session


def _persist_patient(db: Session, data: dict) -> Optional[OAPatient]:
    patient_id = data.get("patient_id") or f"OA-{int(datetime.datetime.now().timestamp() * 1000)}"
    existing = db.query(OAPatient).filter(OAPatient.patient_id == patient_id).first()
    if existing:
        return existing
    patient = OAPatient(
        patient_id=patient_id,
        age=data["age"], sex=data["sex"], bmi=data["bmi"],
        occupation=data.get("occupation", "retired"),
        occupation_detail=data.get("occupation_detail"),
        activity_level=data.get("activity_level", 1),
        prior_joint_injury=bool(data.get("prior_joint_injury", False)),
        family_history_oa=bool(data.get("family_history_oa", False)),
        diabetes=bool(data.get("diabetes", False)),
        terrain_factor=data.get("terrain_factor", 1.0),
        ner_district=data.get("ner_district", "AS-KAMRUP"),
        language=data.get("language", "en"),
        recorded_by=data.get("recorded_by"),
        created_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.post("/screening", response_model=OARiskResponseSchema)
def submit_screening(patient: OAPatientCreateSchema, screening: OAScreeningCreateSchema, db: Session = Depends(get_db)):
    """Register a patient and score their OA screening."""
    screen_data = screening.model_dump()
    screen_data["womac_total"] = round(
        screen_data.get("womac_pain", 0) + screen_data.get("womac_stiffness", 0) + screen_data.get("womac_function", 0), 1
    )
    patient_data = patient.model_dump()

    # Compute risk (works regardless of DB state)
    result = score_screening(patient_data, screen_data)

    # Persist (isolated + fast-fail guarded so scoring always works offline)
    if db_reachable():
        try:
            pat = _persist_patient(db, patient_data)
            db_screen = OAScreening(
                patient_id=pat.patient_id,
                screened_at=datetime.datetime.now(datetime.timezone.utc),
                womac_pain=screen_data["womac_pain"],
                womac_stiffness=screen_data["womac_stiffness"],
                womac_function=screen_data["womac_function"],
                womac_total=screen_data["womac_total"],
                joint_knee=screen_data.get("joint_knee", False),
                joint_hip=screen_data.get("joint_hip", False),
                joint_hand=screen_data.get("joint_hand", False),
                joint_spine=screen_data.get("joint_spine", False),
                crepitus=screen_data.get("crepitus", False),
                joint_swelling=screen_data.get("joint_swelling", False),
                morning_stiffness_min=screen_data.get("morning_stiffness_min", 0),
                risk_probability=result["risk_probability"],
                risk_tier=result["risk_tier"],
                risk_source=result["risk_source"],
                referral_required=result["referral_required"],
                offline_synced=screen_data.get("offline_synced", False),
            )
            db.add(db_screen)
            db.commit()
            result["patient_id"] = pat.patient_id
        except Exception:
            result["patient_id"] = patient_data.get("patient_id") or "UNSAVED-ONLINE"
    else:
        result["patient_id"] = patient_data.get("patient_id") or "UNSAVED-OFFLINE"

    result["disclaimer"] = (
        "Preliminary AI-assisted OA risk screening aid for low-resource settings. "
        "Not a clinical diagnosis — refer suspected cases to an orthopaedic specialist."
    )
    return result


@router.get("/patients")
def list_patients(db: Session = Depends(get_db)):
    """Return patients with their latest screening result."""
    if not db_reachable():
        return []
    try:
        rows = (
            db.query(OAPatient)
            .outerjoin(OAScreening, OAScreening.patient_id == OAPatient.patient_id)
            .with_entities(
                OAPatient.patient_id, OAPatient.age, OAPatient.sex, OAPatient.bmi,
                OAPatient.occupation, OAPatient.ner_district, OAPatient.language,
                OAScreening.risk_tier, OAScreening.risk_probability, OAScreening.screened_at,
            )
            .order_by(desc(OAPatient.id))
            .limit(200)
            .all()
        )
        return [
            {
                "patient_id": r[0], "age": r[1], "sex": r[2], "bmi": r[3],
                "occupation": r[4], "ner_district": r[5], "language": r[6],
                "risk_tier": r[7] or "Low", "risk_probability": r[8] or 0.0,
                "screened_at": str(r[9]) if r[9] else None,
            }
            for r in rows
        ]
    except Exception:
        # Offline/unsupported DB fallback
        return []


@router.get("/patient/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    if not db_reachable():
        raise HTTPException(status_code=404, detail="Patient record unavailable offline")
    try:
        pat = db.query(OAPatient).filter(OAPatient.patient_id == patient_id).first()
        if not pat:
            raise HTTPException(status_code=404, detail="Patient not found")
        screens = (
            db.query(OAScreening)
            .filter(OAScreening.patient_id == patient_id)
            .order_by(desc(OAScreening.screened_at))
            .all()
        )
        return {
            "patient": {
                "patient_id": pat.patient_id, "age": pat.age, "sex": pat.sex,
                "bmi": pat.bmi, "occupation": pat.occupation,
                "occupation_detail": pat.occupation_detail,
                "activity_level": pat.activity_level,
                "prior_joint_injury": pat.prior_joint_injury,
                "family_history_oa": pat.family_history_oa, "diabetes": pat.diabetes,
                "terrain_factor": pat.terrain_factor, "ner_district": pat.ner_district,
                "language": pat.language, "recorded_by": pat.recorded_by,
                "created_at": str(pat.created_at),
            },
            "screenings": [
                {
                    "id": s.id, "screened_at": str(s.screened_at),
                    "womac_pain": s.womac_pain, "womac_stiffness": s.womac_stiffness,
                    "womac_function": s.womac_function, "womac_total": s.womac_total,
                    "crepitus": s.crepitus, "joint_swelling": s.joint_swelling,
                    "morning_stiffness_min": s.morning_stiffness_min,
                    "risk_probability": s.risk_probability, "risk_tier": s.risk_tier,
                    "risk_source": s.risk_source,
                }
                for s in screens
            ],
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Patient record unavailable offline")


@router.get("/risk-summary")
def risk_summary(db: Session = Depends(get_db)):
    """Aggregate screening analytics for the district dashboard."""
    fallback = {
        "total_screenings": 0, "by_tier": {"Low": 0, "Medium": 0, "High": 0, "Critical": 0},
        "referral_rate_pct": 0.0, "by_region": {}, "model_status": {"available": model_available()},
        "source": "offline_fallback",
    }
    if not db_reachable():
        return fallback
    try:
        total = db.query(OAScreening).count()
        if total == 0:
            fallback["source"] = "database_empty"
            return fallback
        tiers = dict(db.query(OAScreening.risk_tier, func.count(OAScreening.id)).group_by(OAScreening.risk_tier).all())
        by_region_rows = (
            db.query(OAPatient.ner_district, func.count(OAScreening.id).label("c"))
            .join(OAScreening, OAScreening.patient_id == OAPatient.patient_id)
            .group_by(OAPatient.ner_district)
            .all()
        )
        referrals = db.query(OAScreening).filter(OAScreening.referral_required.is_(True)).count()
        tier_all = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
        tier_all.update({k: v for k, v in tiers.items() if k in tier_all})
        return {
            "total_screenings": total,
            "by_tier": tier_all,
            "referral_rate_pct": round(referrals / total * 100, 1) if total else 0.0,
            "by_region": dict(by_region_rows),
            "model_status": {"available": model_available()},
            "source": "database",
        }
    except Exception:
        return fallback


@router.get("/ner-regions")
def ner_regions():
    return {"regions": NER_REGIONS, "languages": LANGUAGES}


@router.get("/model-status")
def model_status():
    metrics = {}
    metrics_path = os.path.join(OA_RESULTS_DIR, "oa_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)
    return {
        "available": model_available(),
        "models": metrics,
        "engine": "ml_classifier with clinical_rules fallback",
        "trained_by": "ml/oa/train_oa_model.py",
    }


@router.get("/clinical-rules")
def clinical_rules():
    """Transparent rules-baseline tiers shown for audit / offline use."""
    return {
        "rule_based_tiering": [
            {"tier": "Critical", "hint": "score >= 10", "example": "Age>=60 + obesity + high-load occupation + prior injury + severe symptoms"},
            {"tier": "High", "hint": "score 7-9", "example": "Age>=50 + overweight + female + morning stiffness >= 30 min"},
            {"tier": "Medium", "hint": "score 4-6", "example": "Overweight + family history + moderate WOMAC"},
            {"tier": "Low", "hint": "score < 4", "example": "Younger, normal BMI, low symptom burden"},
        ],
        "note": "Score rules: age, BMI, sex, occupation load, prior injury, family history, diabetes, WOMAC severity, morning stiffness, crepitus.",
        "source": "OARSI risk-factor literature; see ml/oa/results/oa_models.json",
    }
