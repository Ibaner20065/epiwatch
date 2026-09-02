"""
PashuRaksha — Livestock Triage Engine
=====================================
Rule-based + ML-assisted triage for symptom reports.
Evaluates each report against configurable disease rules and
auto-generates alerts when outbreak thresholds are breached.

Aligned with DAHD (Govt. of India) and Maharashtra State
disease notification criteria.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# ── Symptom → Disease Rule Matrix ──────────────────────────────────
# Each rule: list of symptom combos → suspected disease + confidence

DISEASE_RULES: Dict[str, Dict] = {
    "fmd": {
        "name": "Foot-and-Mouth Disease",
        "species": ["cattle", "buffalo", "goat", "sheep"],
        "required_symptoms": ["fever"],
        "indicative_symptoms": ["oral_lesions", "lameness", "salivation", "vesicles_feet", "drop_in_milk"],
        "min_indicative": 2,
        "confidence_base": 0.6,
        "notifiable": True,
        "quarantine_days": 21,
    },
    "lsd": {
        "name": "Lumpy Skin Disease",
        "species": ["cattle", "buffalo"],
        "required_symptoms": ["skin_nodules"],
        "indicative_symptoms": ["fever", "nasal_discharge", "reduced_appetite", "enlarged_lymph_nodes", "drop_in_milk"],
        "min_indicative": 1,
        "confidence_base": 0.7,
        "notifiable": True,
        "quarantine_days": 28,
    },
    "ppr": {
        "name": "Peste des Petits Ruminants",
        "species": ["goat", "sheep"],
        "required_symptoms": ["fever"],
        "indicative_symptoms": ["nasal_discharge", "diarrhea", "oral_lesions", "pneumonia", "sudden_death"],
        "min_indicative": 2,
        "confidence_base": 0.65,
        "notifiable": True,
        "quarantine_days": 21,
    },
    "brucellosis": {
        "name": "Brucellosis",
        "species": ["cattle", "buffalo", "goat"],
        "required_symptoms": [],
        "indicative_symptoms": ["abortion", "retained_placenta", "orchitis", "arthritis", "drop_in_milk"],
        "min_indicative": 2,
        "confidence_base": 0.5,
        "notifiable": True,
        "quarantine_days": 14,
    },
    "ai_h5n1": {
        "name": "Avian Influenza (H5N1)",
        "species": ["poultry"],
        "required_symptoms": [],
        "indicative_symptoms": ["sudden_death", "drop_in_eggs", "respiratory_distress", "swollen_head", "cyanosis", "diarrhea"],
        "min_indicative": 2,
        "confidence_base": 0.7,
        "notifiable": True,
        "quarantine_days": 28,
    },
}

# ── Outbreak Threshold Rules ───────────────────────────────────────
# Maharashtra state notification criteria (simplified)

OUTBREAK_THRESHOLDS = {
    "mortality_spike": {
        "description": "Elevated mortality in a village within 7 days",
        "threshold_deaths": 3,
        "window_days": 7,
        "severity": "warning",
    },
    "cluster_cases": {
        "description": "Multiple symptomatic reports in same block within 7 days",
        "threshold_reports": 5,
        "window_days": 7,
        "severity": "outbreak",
    },
    "mass_mortality": {
        "description": "Mass die-off reported",
        "threshold_deaths": 10,
        "window_days": 3,
        "severity": "emergency",
    },
    "poultry_die_off": {
        "description": "Poultry mass mortality (AI suspicion)",
        "threshold_deaths": 50,
        "window_days": 3,
        "severity": "emergency",
        "species": "poultry",
    },
}

# ── All recognized symptom codes ───────────────────────────────────

SYMPTOM_CODES = {
    1: "fever",
    2: "oral_lesions",
    3: "lameness",
    4: "salivation",
    5: "vesicles_feet",
    6: "drop_in_milk",
    7: "skin_nodules",
    8: "nasal_discharge",
    9: "reduced_appetite",
    10: "enlarged_lymph_nodes",
    11: "diarrhea",
    12: "pneumonia",
    13: "sudden_death",
    14: "abortion",
    15: "retained_placenta",
    16: "orchitis",
    17: "arthritis",
    18: "drop_in_eggs",
    19: "respiratory_distress",
    20: "swollen_head",
    21: "cyanosis",
    22: "bloody_stool",
    23: "dehydration",
    24: "weight_loss",
    25: "itching_scratching",
}

# Reverse lookup
SYMPTOM_CODE_REVERSE = {v: k for k, v in SYMPTOM_CODES.items()}


def evaluate_report(
    species: str,
    symptoms: List[str],
    num_affected: int,
    num_dead: int,
    severity: str = "moderate",
) -> Dict[str, Any]:
    """
    Evaluate a single symptom report against disease rules.

    Returns:
        {
            "suspected_diseases": [{"disease_id", "name", "confidence", "notifiable", "quarantine_days"}],
            "alert_recommended": bool,
            "alert_severity": str | None,
            "alert_reason": str | None,
            "triage_notes": str,
        }
    """
    suspected = []

    for disease_id, rule in DISEASE_RULES.items():
        if species not in rule["species"]:
            continue

        # Check required symptoms
        has_required = all(s in symptoms for s in rule["required_symptoms"])
        if rule["required_symptoms"] and not has_required:
            continue

        # Count indicative symptoms
        indicative_count = sum(1 for s in rule["indicative_symptoms"] if s in symptoms)
        if indicative_count < rule["min_indicative"]:
            continue

        # Compute confidence
        confidence = rule["confidence_base"]
        # Boost confidence with more indicative symptoms
        max_indicative = len(rule["indicative_symptoms"])
        if max_indicative > 0:
            confidence += 0.3 * (indicative_count / max_indicative)
        # Severity boost
        if severity == "severe":
            confidence += 0.05
        elif severity == "mass_mortality":
            confidence += 0.10
        confidence = min(confidence, 0.99)

        suspected.append({
            "disease_id": disease_id,
            "name": rule["name"],
            "confidence": round(confidence, 3),
            "notifiable": rule["notifiable"],
            "quarantine_days": rule["quarantine_days"],
            "matching_symptoms": [s for s in symptoms if s in rule["required_symptoms"] + rule["indicative_symptoms"]],
        })

    # Sort by confidence descending
    suspected.sort(key=lambda x: x["confidence"], reverse=True)

    # Determine alert recommendation
    alert_recommended = False
    alert_severity = None
    alert_reason = None

    if num_dead >= OUTBREAK_THRESHOLDS["mass_mortality"]["threshold_deaths"]:
        alert_recommended = True
        alert_severity = "emergency"
        alert_reason = f"Mass mortality: {num_dead} deaths reported"
    elif species == "poultry" and num_dead >= OUTBREAK_THRESHOLDS["poultry_die_off"]["threshold_deaths"]:
        alert_recommended = True
        alert_severity = "emergency"
        alert_reason = f"Poultry mass die-off: {num_dead} deaths, suspected AI/H5N1"
    elif num_dead >= OUTBREAK_THRESHOLDS["mortality_spike"]["threshold_deaths"]:
        alert_recommended = True
        alert_severity = "warning"
        alert_reason = f"Elevated mortality: {num_dead} deaths"
    elif severity == "mass_mortality":
        alert_recommended = True
        alert_severity = "outbreak"
        alert_reason = "Mass mortality severity reported by field observer"
    elif severity == "severe" and num_affected >= 5:
        alert_recommended = True
        alert_severity = "warning"
        alert_reason = f"Severe symptoms in {num_affected} animals"
    elif suspected and suspected[0]["confidence"] >= 0.8 and suspected[0]["notifiable"]:
        alert_recommended = True
        alert_severity = "warning"
        alert_reason = f"High-confidence suspected {suspected[0]['name']} (conf={suspected[0]['confidence']})"

    # Build triage notes
    if suspected:
        top = suspected[0]
        triage_notes = (
            f"Primary suspicion: {top['name']} (confidence {top['confidence']:.0%}). "
            f"Matching symptoms: {', '.join(top['matching_symptoms'])}. "
            f"{'NOTIFIABLE DISEASE — report to DVO immediately.' if top['notifiable'] else ''}"
        )
    else:
        triage_notes = "No specific disease pattern matched. General veterinary examination recommended."

    return {
        "suspected_diseases": suspected,
        "alert_recommended": alert_recommended,
        "alert_severity": alert_severity,
        "alert_reason": alert_reason,
        "triage_notes": triage_notes,
    }


def build_alert_message(
    disease_name: str,
    species: str,
    village: str,
    block: str,
    district: str,
    num_affected: int,
    num_dead: int,
    reason: str,
) -> Dict[str, str]:
    """Generate alert messages in English, Hindi, and Marathi."""
    en = (
        f"⚠️ ALERT: Suspected {disease_name} in {species} at {village}, "
        f"{block} taluka, {district} district. "
        f"{num_affected} affected, {num_dead} dead. {reason}. "
        f"Immediate veterinary investigation required."
    )
    hi = (
        f"⚠️ चेतावनी: {village}, {block} तालुका, {district} जिला में "
        f"{species} में संदिग्ध {disease_name}। "
        f"{num_affected} प्रभावित, {num_dead} मृत। "
        f"तत्काल पशु चिकित्सा जांच आवश्यक।"
    )
    mr = (
        f"⚠️ सूचना: {village}, {block} तालुका, {district} जिल्ह्यातील "
        f"{species} मध्ये संशयित {disease_name}। "
        f"{num_affected} बाधित, {num_dead} मृत्यू। "
        f"तात्काळ पशुवैद्यकीय तपासणी आवश्यक."
    )
    return {"en": en, "hi": hi, "mr": mr}


def generate_alert_id() -> str:
    return f"ALT-{uuid.uuid4().hex[:8].upper()}"


def generate_event_id() -> str:
    return f"EVT-{uuid.uuid4().hex[:8].upper()}"


def generate_report_id() -> str:
    return f"RPT-{uuid.uuid4().hex[:8].upper()}"


def generate_sample_id() -> str:
    return f"SMP-{uuid.uuid4().hex[:8].upper()}"


def generate_advisory_id() -> str:
    return f"ADV-{uuid.uuid4().hex[:8].upper()}"
