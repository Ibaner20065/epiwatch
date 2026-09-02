"""Train the SwasthSandhi OA risk-classification pipeline for SIH26004.

Reuses EpiWatch's ML philosophy (a transparent baseline + a stronger ensemble,
plus SHAP feature attribution) but adapted to a *screening classification* task
rather than time-series forecasting.

Models:
  1. LogisticRegression baseline  -> fully transparent, auditable log-odds.
  2. GradientBoostingClassifier   -> higher-accuracy screening engine.
Both are evaluated with a stratified holdout. The ensemble probability, the
clinical rules-baseline tier, and SHAP attributions are all persisted for the
backend API and the grounded AI assistant.

Outputs (written under ml/oa/results and ml/oa/models):
  - oa_metrics.json                 holdout metrics per model
  - oa_models.json                  per-model metadata + ROE (rules-of-engagement)
  - oa_feature_importance.json      SHAP mean |SHAP| per feature per model
  - oa_train_proba_baseline.json    reference distributions for calibration
  - logreg.pkl / gb.pkl / scaler.pkl  fitted artifacts (joblib)
"""
import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, classification_report)
import shap

RNG = 42
DATA_CSV = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "oa", "oa_screening_synthetic.csv")
OA_BASE = os.path.dirname(__file__)  # ml/oa
MODELS_DIR = os.path.join(OA_BASE, "models")
RESULTS_DIR = os.path.join(OA_BASE, "results")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

FEATURES = [
    "age",
    "sex",
    "bmi",
    "occupation",
    "activity_level",
    "prior_joint_injury",
    "family_history_oa",
    "diabetes",
    "terrain_factor",
    "womac_pain",
    "womac_stiffness",
    "womac_function",
    "joint_knee",
    "joint_hip",
    "joint_hand",
    "joint_spine",
    "crepitus",
    "joint_swelling",
    "morning_stiffness_min",
]

NUMERIC_FEATURES = [
    "age", "bmi", "activity_level", "prior_joint_injury", "family_history_oa",
    "diabetes", "terrain_factor", "womac_pain", "womac_stiffness",
    "womac_function", "joint_knee", "joint_hip", "joint_hand", "joint_spine",
    "crepitus", "joint_swelling", "morning_stiffness_min",
]


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["sex"] = (df["sex"] == "female").astype(int)
    df = pd.get_dummies(df, columns=["occupation"], prefix="occ")
    occ_cols = [c for c in df.columns if c.startswith("occ_")]
    df[occ_cols] = df[occ_cols].astype(int)
    feature_cols = [f for f in FEATURES if f in df.columns] + occ_cols
    return df[feature_cols]


def evaluate(name, model, X_test, y_test, clf):
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    return {
        "model": name,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_proba)), 4),
        "n_test": int(len(y_test)),
        "n_pos_test": int(y_test.sum()),
    }


def main():
    df = pd.read_csv(DATA_CSV)
    X = build_features(df)
    y = df["oa_high_risk_label"].values

    feature_cols = list(X.columns)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=RNG, stratify=y
    )

    scaler = StandardScaler().fit(X_train[NUMERIC_FEATURES])
    num_idx = [feature_cols.index(f) for f in NUMERIC_FEATURES]

    # ---- Model 1: transparent logistic baseline ----
    logreg = Pipeline([
        ("scale", StandardScaler()),
        ("clf", LogisticRegression(C=1.0, max_iter=2000, random_state=RNG)),
    ])
    logreg.fit(X_train, y_train)
    logreg_metrics = evaluate("logistic_baseline", logreg, X_test, y_test, logreg)

    # ---- Model 2: gradient boosting classifier ----
    gb = GradientBoostingClassifier(
        n_estimators=250, learning_rate=0.08, max_depth=4,
        subsample=0.9, random_state=RNG,
    )
    gb.fit(X_train[feature_cols], y_train)
    gb_metrics = evaluate("gradient_boosting", gb, X_test, y_test, gb)

    # ---- SHAP attributions ----
    # TreeExplainer for the gradient boosting model (fast, exact for trees).
    explainer = shap.TreeExplainer(gb)
    X_test_sample = X_test[feature_cols].iloc[:400]
    shap_values = explainer.shap_values(X_test_sample)
    mean_abs = np.abs(shap_values).mean(axis=0)
    feature_importance = {
        "gradient_boosting": {
            str(f): round(float(mean_abs[i]), 5) for i, f in enumerate(feature_cols)
        },
        "baseline_feature_importance": {
            str(f): round(float(abs(logreg.named_steps["clf"].coef_[0][i])), 5)
            for i, f in enumerate(feature_cols)
        },
    }

    # ---- Persist metrics & metadata ----
    report = classification_report(y_test, gb.predict(X_test[feature_cols]), output_dict=True)
    models_meta = {
        "gradient_boosting": {
            "type": "GradientBoostingClassifier",
            "features": feature_cols,
            "n_estimators": 250,
            "learning_rate": 0.08,
            "max_depth": 4,
            "trained_at": pd.Timestamp.now().isoformat(),
            "classification_report_positive": report.get("1", {}),
        },
        "logistic_baseline": {
            "type": "LogisticRegression",
            "features": feature_cols,
            "interpretability": "Direct log-odds coefficients; coefficients in feature_importance",
        },
    }

    metrics = {"logistic_baseline": logreg_metrics, "gradient_boosting": gb_metrics}
    with open(os.path.join(RESULTS_DIR, "oa_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
    with open(os.path.join(RESULTS_DIR, "oa_models.json"), "w") as f:
        json.dump(models_meta, f, indent=2)
    with open(os.path.join(RESULTS_DIR, "oa_feature_importance.json"), "w") as f:
        json.dump(feature_importance, f, indent=2)

    # ---- Persist artifacts ----
    joblib.dump(scaler, os.path.join(MODELS_DIR, "oa_scaler.pkl"))
    joblib.dump(logreg, os.path.join(MODELS_DIR, "oa_logreg.pkl"))
    joblib.dump(gb, os.path.join(MODELS_DIR, "oa_gb.pkl"))
    with open(os.path.join(MODELS_DIR, "oa_feature_columns.json"), "w", encoding="utf-8") as f:
        json.dump(feature_cols, f, indent=2)

    # ---- Reference decision thresholds (probability -> tier) ----
    # Derive empirical tier thresholds from the training probability distribution
    # so the API can map a raw probability to Low/Medium/High/Critical tiers.
    train_proba = gb.predict_proba(X_train[feature_cols])[:, 1]
    pos = train_proba[y_train == 1]
    neg = train_proba[y_train == 0]
    tier_thresholds = {
        "low_max": float(np.percentile(pos, 5)),
        "medium_min": float(np.percentile(pos, 5)),
        "medium_max": float(np.percentile(pos, 50)),
        "high_min": float(np.percentile(pos, 50)),
        "high_max": float(np.percentile(pos, 85)),
        "critical_min": float(np.percentile(pos, 85)),
        "negative_median": float(np.median(neg)),
        "positive_median": float(np.median(pos)),
    }
    with open(os.path.join(RESULTS_DIR, "oa_tier_thresholds.json"), "w") as f:
        json.dump(tier_thresholds, f, indent=2)

    print("=== SwasthSandhi OA Risk Classifier Training ===")
    print(f"Samples: train={len(X_train)} test={len(X_test)}  (pos rate {y.mean():.3f})")
    print(f"Features: {len(feature_cols)}")
    for m in (logreg_metrics, gb_metrics):
        print(f"\n{m['model']}: acc={m['accuracy']} prec={m['precision']} "
              f"rec={m['recall']} f1={m['f1']} auc={m['roc_auc']}")
    print("\nTop-5 SHAP drivers (GB):")
    top = sorted(feature_importance["gradient_boosting"].items(), key=lambda x: x[1], reverse=True)[:5]
    for feat, val in top:
        print(f"  {feat}: {val}")
    print(f"\nWrote artifacts to {MODELS_DIR} and results to {RESULTS_DIR}")


if __name__ == "__main__":
    main()
