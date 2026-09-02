"""Generate a realistic synthetic Osteoarthritis (OA) screening dataset.

The synthetic population is grounded in the published clinical epidemiology of
Osteoarthritis (see OA_RISK_FACTORS docstring below). It is NOT real patient
data -- it is a labeled training population used to train and demonstrate the
SwasthSandhi OA risk-classification pipeline for SIH26004 (MDoNER NER).

Because the task is a screening / risk-stratification classifier (HIGH risk vs
LOW risk for early OA) rather than a time-series forecast, we model the
probability of "high risk of early OA" from established risk-factor effect
sizes, then derive a WOMAC-style subjective severity score conditional on that
risk.

Reference risk factors and approximate directions (consistent with the
Osteoarthritis Research Society International (OARSI) risk literature):
  - AGE            : strongest non-modifiable driver, logit slope rises after 45
  - FEMALE         : ~1.5-2x age-adjusted prevalence for knee/hand OA
  - BMI            : obesity is a dominant modifiable driver (metabolic + load)
  - OCCUPATION     : kneeling/squatting/heavy-lift (agri/tea-garden) elevates risk
  - PRIOR_INJURY   : strong driver (history of joint trauma), esp. young-onset
  - FAMILY_HISTORY : genetic predisposition
  - DIABETES       : metabolic comorbidity increases risk
  - PHYSICAL_ACTIVITY_LEVEL: both extremes (0 = sedentary, 1 = light, 2 = heavy)
  - TERRAIN        : NER hilly terrain factor proxies daily climbing/kneeling load
"""
import os
import json
import numpy as np
import pandas as pd

RNG_SEED = 42
N_PATIENTS = 5000
np.random.seed(RNG_SEED)

OUT_CSV = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "oa", "oa_screening_synthetic.csv")
OUT_META = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "oa", "oa_dataset_manifest.json")

# NER districts for provenance realism (MDoNER region); synthetic coords not required.
NER_DISTRICTS = [
    "KAMRUP", "GOLAGHAT", "DIBRUGARH", "SONITPUR", "SIBSAGAR", "TINSUKIA",
    "NATUN-NAGPUR", "AGARTALA", "AIZAWL", "MOKOKCHUNG", "UKHRUL", "WEST-GARO-HILLS",
]

WORK_STRINGS = {
    "agriculture": "Tea-garden / paddy field worker (kneeling, load carrying)",
    "domestic": "Domestic / household worker (squatting, floor tasks)",
    "service": "Service / clerical worker (mostly sedentary)",
    "trade": "Small trader / vendor (standing hours)",
    "retired": "Retired / elderly (sedentary)",
}

OCCUPATION_MAP = {
    "agriculture": "heavy",
    "domestic": "heavy",
    "service": "light",
    "trade": "moderate",
    "retired": "sedentary",
}

def logit(p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p))


def compute_high_risk_prob(age, female, bmi, occupation, prior_injury, family_hist, diabetes, activity, terrain):
    """Logistic-style risk model with literature-informed coefficients."""
    z = -4.5
    z += 0.075 * (age - 50)                      # age slope, steepens after 45
    z += 0.55 * int(female)                      # female predilection
    z += 0.10 * (bmi - 26)                       # obesity / BMI load
    occ_eff = {"sedentary": -0.40, "light": -0.10, "moderate": 0.10, "heavy": 0.80}
    z += occ_eff[occupation]
    z += 1.20 * int(prior_injury)                # joint trauma history
    z += 0.75 * int(family_hist)                 # genetic component
    z += 0.45 * int(diabetes)                    # metabolic comorbidity
    z += 0.15 * (activity - 1.0)                 # physical loading
    z += 0.25 * (terrain - 1.0)                  # NER terrain climbing/kneeling load
    return 1.0 / (1.0 + np.exp(-z))


def gen_patient(i):
    age = int(np.clip(np.round(np.random.normal(58, 13)), 40, 85))
    female = bool(np.random.rand() < 0.55)
    bmi = round(float(np.clip(np.random.normal(25.5, 4.5), 16.0, 40.0)), 1)
    occupation = str(np.random.choice(list(OCCUPATION_MAP.keys()), p=[0.30, 0.15, 0.15, 0.15, 0.25]))
    activity = {"sedentary": 0, "light": 1, "moderate": 1, "heavy": 2}[OCCUPATION_MAP[occupation]]
    prior_injury = bool(np.random.rand() < 0.18)
    family_hist = bool(np.random.rand() < 0.28)
    diabetes = bool(np.random.rand() < 0.22)
    terrain = float(np.random.choice([0.6, 1.0, 1.5], p=[0.35, 0.35, 0.30]))

    p_high = compute_high_risk_prob(age, female, bmi, OCCUPATION_MAP[occupation], prior_injury, family_hist, diabetes, activity, terrain)
    high_risk = bool(np.random.rand() < p_high)

    # ---- WOMAC-like scores (0-100, higher = worse) ----
    # These are NOISY, partially-overlapping clinical measurements. They are
    # correlated with risk but do NOT deterministically reconstruct the label,
    # which keeps the classification task realistic (AUC in a believable band
    # rather than a perfect 1.0).
    pain = float(np.clip(np.random.normal(22, 17), 0, 100))
    stiffness = float(np.clip(np.random.normal(25, 18), 0, 100))
    function = float(np.clip(np.random.normal(25, 18), 0, 100))
    if high_risk:
        pain += float(np.clip(np.random.normal(18, 12), 0, 80))
        stiffness += float(np.clip(np.random.normal(20, 12), 0, 80))
        function += float(np.clip(np.random.normal(17, 13), 0, 80))
    pain = round(float(np.clip(pain, 0, 100)), 1)
    stiffness = round(float(np.clip(stiffness, 0, 100)), 1)
    function = round(float(np.clip(function, 0, 100)), 1)

    # Affected joints
    joints = {"knee": bool(np.random.rand() < 0.80), "hip": bool(np.random.rand() < 0.35), "hand": bool(np.random.rand() < 0.25), "spine": bool(np.random.rand() < 0.20)}
    if not any(joints.values()):
        joints["knee"] = True

    crepitus = bool(np.random.rand() < (0.52 if high_risk else 0.14))
    swelling = bool(np.random.rand() < (0.34 if high_risk else 0.07))
    morning_stiffness_min = int(np.clip(np.round(np.random.normal(45 if high_risk else 14, 18)), 0, 120))

    district = str(np.random.choice(NER_DISTRICTS))
    language = str(np.random.choice(["as", "bn", "hi", "en"], p=[0.35, 0.25, 0.25, 0.15]))

    return {
        "patient_id": f"OA-{30000 + i}",
        "age": age,
        "sex": "female" if female else "male",
        "bmi": bmi,
        "occupation": occupation,
        "occupation_detail": WORK_STRINGS[occupation],
        "activity_level": activity,
        "prior_joint_injury": int(prior_injury),
        "family_history_oa": int(family_hist),
        "diabetes": int(diabetes),
        "terrain_factor": terrain,
        "ner_district": district,
        "language": language,
        "womac_pain": round(pain, 1),
        "womac_stiffness": round(stiffness, 1),
        "womac_function": round(function, 1),
        "womac_total": round(pain + stiffness + function, 1),
        "joint_knee": int(joints["knee"]),
        "joint_hip": int(joints["hip"]),
        "joint_hand": int(joints["hand"]),
        "joint_spine": int(joints["spine"]),
        "crepitus": int(crepitus),
        "joint_swelling": int(swelling),
        "morning_stiffness_min": morning_stiffness_min,
        "oa_high_risk_label": int(high_risk),
    }


def main():
    rows = [gen_patient(i) for i in range(N_PATIENTS)]
    df = pd.DataFrame(rows)
    df.to_csv(OUT_CSV, index=False)

    manifest = {
        "title": "SwasthSandhi - Synthetic OA Screening Dataset (SIH26004)",
        "generator": "ml/oa/synthesize_oa_data.py",
        "seed": RNG_SEED,
        "n_patients": int(len(df)),
        "n_high_risk": int(df["oa_high_risk_label"].sum()),
        "n_low_risk": int((1 - df["oa_high_risk_label"]).sum()),
        "prevalence_high_risk_pct": round(float(df["oa_high_risk_label"].mean() * 100), 1),
        "columns": list(df.columns),
        "disclaimer": "Synthetic data generated from clinical risk-factor literature. Not real patient data.",
        "walkthrough_verify": f"Import, then check: df['oa_high_risk_label'].mean() ~ {round(float(df['oa_high_risk_label'].mean()),3)}; age distribution 35-85",
    }
    with open(OUT_META, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Wrote {len(df)} synthetic OA patients -> {OUT_CSV}")
    print(f"High-risk prevalence: {manifest['prevalence_high_risk_pct']}%")
    print(f"Features: {len(df.columns)}")


if __name__ == "__main__":
    main()
