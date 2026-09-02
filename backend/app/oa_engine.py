"""SwasthSandhi OA risk-scoring engine (SIH26004).

Loads the persisted OA classifier artifacts (trained by
ml/oa/train_oa_model.py), exposes a `score_screening()` function that turns a
patient + screening payload into a risk probability, a severity tier and a
human-readable factor explanation, and transparently falls back to clinical
rules when the ML artifacts are unavailable (offline / not-yet-trained).

All outputs are auditable: source is either 'ml_classifier' or 'clinical_rules'.
"""
import os
import json
from typing import Dict, Any, Optional

import joblib
import numpy as np
import pandas as pd

OA_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "oa", "models")
OA_RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "oa", "results")

# Occupations are one-hot encoded at train time; keep the same set.
OCCUPATION_LEVELS = ["agriculture", "domestic", "service", "trade", "retired"]

_engine_cache: Dict[str, Any] = {}


def _load_tier_thresholds() -> Dict[str, float]:
    path = os.path.join(OA_RESULTS_DIR, "oa_tier_thresholds.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {
        "low_max": 0.0,
        "medium_min": 0.0,
        "medium_max": 0.30,
        "high_min": 0.30,
        "high_max": 0.60,
        "critical_min": 0.60,
        "negative_median": 0.05,
        "positive_median": 0.40,
    }


def _load_mean_importance() -> Dict[str, float]:
    path = os.path.join(OA_RESULTS_DIR, "oa_feature_importance.json")
    if os.path.exists(path):
        with open(path) as f:
            data = json.load(f)
        return data.get("gradient_boosting", {})
    return {}


def model_available() -> bool:
    return all(
        os.path.exists(os.path.join(OA_MODELS_DIR, f))
        for f in ("oa_gb.pkl", "oa_scaler.pkl", "oa_feature_columns.json")
    )


def compute_rule_tier(age: int, bmi: float, female: bool, occupation: str,
                      prior_injury: bool, fam_hist: bool, diabetes: bool,
                      womac_total: float, morning_stiff_min: int,
                      crepitus: bool) -> Dict[str, Any]:
    """Transparent clinical rules-baseline severity assessment.

    Uses widely accepted OA risk strata: age, obesity (BMI>=30), female sex,
    heavy-load occupation, prior joint injury, metabolic comorbidity, and the
    WOMAC severity band. Each rule contributes a point-adjusted score.
    """
    score = 0.0
    reasons = []

    if age >= 60:
        score += 2
        reasons.append("Age >= 60 (strong non-modifiable risk)")
    elif age >= 50:
        score += 1
        reasons.append("Age 50-59 (rising OA risk)")

    if bmi >= 30:
        score += 2
        reasons.append("Obesity (BMI >= 30)")
    elif bmi >= 27:
        score += 1
        reasons.append("Overweight (BMI 27-30)")

    if female:
        score += 1
        reasons.append("Female sex (higher knee/hand OA prevalence)")

    if occupation in ("agriculture", "domestic"):
        score += 2
        reasons.append("High-load occupation (kneeling / squatting exposure)")
    elif occupation == "trade":
        score += 1
        reasons.append("Prolonged standing occupation")

    if prior_injury:
        score += 2
        reasons.append("Prior joint injury (trauma history)")
    if fam_hist:
        score += 1
        reasons.append("Family history of OA")
    if diabetes:
        score += 1
        reasons.append("Diabetes (metabolic comorbidity)")

    if womac_total >= 180:
        score += 2
        reasons.append("Severe WOMAC symptom burden")
    elif womac_total >= 90:
        score += 1
        reasons.append("Moderate WOMAC symptom burden")

    if morning_stiff_min >= 60:
        score += 2
        reasons.append("Marked morning stiffness >= 60 min")
    elif morning_stiff_min >= 30:
        score += 1
        reasons.append("Morning stiffness 30-60 min")

    if crepitus:
        score += 1
        reasons.append("Crepitus on examination")

    # Map cumulative score to tier
    if score >= 10:
        tier = "Critical"
    elif score >= 7:
        tier = "High"
    elif score >= 4:
        tier = "Medium"
    else:
        tier = "Low"

    prob = float(np.clip(score / 13.0, 0.05, 0.97))
    return {"tier": tier, "score": int(round(score)), "reasons": reasons, "probability": prob}


def _build_feature_vector(patient: Dict[str, Any], screen: Dict[str, Any]) -> np.ndarray:
    """Construct the 23-feature vector in the exact train-time order.

    Feature order (see ml/oa/train_oa_model.py FEATURES + occupation one-hots).
    """
    occupation = patient.get("occupation", "retired")
    occ_onehot = [1.0 if occupation == o else 0.0 for o in OCCUPATION_LEVELS]

    vals = [
        float(patient.get("age", 50)),
        float(1 if patient.get("sex") == "female" else 0),
        float(patient.get("bmi", 25)),
        float(patient.get("activity_level", 1)),
        float(1 if patient.get("prior_joint_injury") else 0),
        float(1 if patient.get("family_history_oa") else 0),
        float(1 if patient.get("diabetes") else 0),
        float(patient.get("terrain_factor", 1.0)),
        float(screen.get("womac_pain", 0)),
        float(screen.get("womac_stiffness", 0)),
        float(screen.get("womac_function", 0)),
        float(1 if screen.get("joint_knee") else 0),
        float(1 if screen.get("joint_hip") else 0),
        float(1 if screen.get("joint_hand") else 0),
        float(1 if screen.get("joint_spine") else 0),
        float(1 if screen.get("crepitus") else 0),
        float(1 if screen.get("joint_swelling") else 0),
        float(screen.get("morning_stiffness_min", 0)),
    ]
    vec = np.array(vals + occ_onehot, dtype=float).reshape(1, -1)
    return vec


def _predict_ml(patient: Dict[str, Any], screen: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Run the gradient-boosting classifier and produce a full score dict,
    or return None to signal fallback to clinical rules."""
    try:
        gb = joblib.load(os.path.join(OA_MODELS_DIR, "oa_gb.pkl"))
        with open(os.path.join(OA_MODELS_DIR, "oa_feature_columns.json"), encoding="utf-8") as f:
            feature_cols = json.load(f)
        raw = _build_feature_vector(patient, screen)
        X = pd.DataFrame(raw, columns=feature_cols)
        prob = float(gb.predict_proba(X)[0, 1])
        tier = _tier_from_probability(prob)
        return {
            "risk_probability": round(prob, 4),
            "risk_tier": tier,
            "risk_source": "ml_classifier",
            "top_factors": _top_factors(patient, screen),
            "referral_required": tier in ("High", "Critical"),
        }
    except Exception:
        return None


def _tier_from_probability(prob: float) -> str:
    t = _load_tier_thresholds()
    if prob >= t.get("critical_min", 0.60):
        return "Critical"
    if prob >= t.get("high_min", 0.30):
        return "High"
    if prob >= t.get("medium_min", 0.10):
        return "Medium"
    return "Low"


def _top_factors(patient: Dict[str, Any], screen: Dict[str, Any]) -> list:
    """Return human-readable top contributing risk factors.

    Uses the persisted SHAP mean-|importance| to order candidates, then labels
    them with the actual observed values for a screening-friendly explanation.
    """
    mean_imp = _load_mean_importance()
    labels = {
        "age": ("Age", f"{patient.get('age')} years"),
        "bmi": ("Body Mass Index", f"{patient.get('bmi')}"),
        "sex": ("Sex", patient.get("sex", "male")),
        "womac_pain": ("Knee pain (WOMAC)", f"{screen.get('womac_pain', 0)}/100"),
        "womac_stiffness": ("Joint stiffness (WOMAC)", f"{screen.get('womac_stiffness', 0)}/100"),
        "womac_function": ("Daily function loss (WOMAC)", f"{screen.get('womac_function', 0)}/100"),
        "morning_stiffness_min": ("Morning stiffness", f"{screen.get('morning_stiffness_min', 0)} min"),
        "crepitus": ("Crepitus on exam", "present" if screen.get("crepitus") else "absent"),
        "prior_joint_injury": ("Prior joint injury", "yes" if patient.get("prior_joint_injury") else "no"),
        "family_history_oa": ("Family history of OA", "yes" if patient.get("family_history_oa") else "no"),
        "diabetes": ("Diabetes", "yes" if patient.get("diabetes") else "no"),
        "occupation": ("Occupation load", patient.get("occupation", "retired")),
        "terrain_factor": ("NER terrain factor", str(patient.get("terrain_factor", 1.0))),
    }

    candidates = [
        ("age", mean_imp.get("age", 0)),
        ("bmi", mean_imp.get("bmi", 0)),
        ("womac_pain", mean_imp.get("womac_pain", 0)),
        ("womac_stiffness", mean_imp.get("womac_stiffness", 0)),
        ("womac_function", mean_imp.get("womac_function", 0)),
        ("morning_stiffness_min", mean_imp.get("morning_stiffness_min", 0)),
        ("crepitus", mean_imp.get("crepitus", 0)),
        ("prior_joint_injury", mean_imp.get("prior_joint_injury", 0)),
        ("family_history_oa", mean_imp.get("family_history_oa", 0)),
        ("diabetes", mean_imp.get("diabetes", 0)),
        ("terrain_factor", mean_imp.get("terrain_factor", 0)),
    ]
    candidates.sort(key=lambda x: x[1], reverse=True)
    return [
        {"factor": labels[k][0], "value": labels[k][1], "importance": round(float(v), 4)}
        for k, v in candidates[:5] if k in labels and v > 0
    ]


def score_screening(patient: Dict[str, Any], screen: Dict[str, Any]) -> Dict[str, Any]:
    """Score one screening encounter, returning a full risk response."""
    if model_available():
        ml_result = _predict_ml(patient, screen)
        if ml_result is not None:
            return ml_result

    # Clinical rules fallback (offline / no model)
    rules = compute_rule_tier(
        age=int(patient.get("age", 50)),
        bmi=float(patient.get("bmi", 25)),
        female=patient.get("sex") == "female",
        occupation=patient.get("occupation", "retired"),
        prior_injury=bool(patient.get("prior_joint_injury")),
        fam_hist=bool(patient.get("family_history_oa")),
        diabetes=bool(patient.get("diabetes")),
        womac_total=float(screen.get("womac_total", 0)),
        morning_stiff_min=int(screen.get("morning_stiffness_min", 0)),
        crepitus=bool(screen.get("crepitus")),
    )
    return {
        "risk_probability": round(rules["probability"], 4),
        "risk_tier": rules["tier"],
        "risk_source": "clinical_rules",
        "top_factors": rules["reasons"],
        "referral_required": rules["tier"] in ("High", "Critical"),
    }
