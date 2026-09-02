"""
PashuRaksha — Unified Livestock Machine Learning Forecasting Pipeline
=====================================================================
Trains ensemble forecasting models (HistGradientBoostingRegressor + XGBRegressor)
for 9 Maharashtra districts across 5 priority livestock diseases:
  - Foot-and-Mouth Disease (FMD)
  - Lumpy Skin Disease (LSD)
  - Peste des Petits Ruminants (PPR)
  - Brucellosis
  - Avian Influenza (H5N1)

Incorporates:
  1. District Weekly Surveillance (data/raw/livestock/livestock_master.csv)
  2. MOSPI/Dataful National Baseline Priors (data/processed/dataful_disease_summary.json)

Outputs:
  ml/livestock/models/*.pkl
  ml/livestock/results/model_metrics.json
  ml/livestock/results/training_summary.json
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "livestock", "livestock_master.csv")
DATAFUL_SUMMARY_PATH = os.path.join(BASE_DIR, "data", "processed", "dataful_disease_summary.json")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


def load_national_priors():
    """Load national baseline statistics from Dataful MOSPI summary."""
    priors = {}
    if os.path.exists(DATAFUL_SUMMARY_PATH):
        try:
            with open(DATAFUL_SUMMARY_PATH, "r", encoding="utf-8") as f:
                dataful_summary = json.load(f)
            for slug, info in dataful_summary.items():
                priors[slug] = {
                    "mean_annual_cfr": info.get("mean_annual_cfr", 0.02),
                    "overall_cfr": info.get("overall_cfr", 0.02),
                    "total_outbreaks": info.get("total_outbreaks_2005_2015", 100),
                    "total_attacks": info.get("total_attacks_2005_2015", 1000),
                }
        except Exception as e:
            print(f"Warning: Could not load Dataful priors: {e}")
    return priors


def load_and_prepare_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Livestock data not found at {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    df["week_start"] = pd.to_datetime(df["week_start"])
    # Aggregate cases per district, disease, week_start
    agg = df.groupby(["district_id", "disease_id", "week_start"]).agg({
        "reported_cases": "sum",
        "deaths": "sum"
    }).reset_index().sort_values(["district_id", "disease_id", "week_start"])
    return agg


def create_features(group_df, national_priors):
    """Create temporal lag, rolling features, and national priors for time series forecasting."""
    df = group_df.copy()
    disease_id = df["disease_id"].iloc[0] if len(df) > 0 else "fmd"
    prior = national_priors.get(disease_id, {"mean_annual_cfr": 0.02, "total_attacks": 50000})

    df["target"] = df["reported_cases"]
    df["month"] = df["week_start"].dt.month
    df["week_of_year"] = df["week_start"].dt.isocalendar().week.astype(int)

    # Lags
    for lag in [1, 2, 3, 4]:
        df[f"lag_{lag}"] = df["target"].shift(lag)

    # Rolling averages
    df["rolling_mean_4"] = df["target"].shift(1).rolling(4).mean()
    df["rolling_std_4"] = df["target"].shift(1).rolling(4).std().fillna(0)

    # National prior scaling feature (normalized baseline intensity)
    df["nat_prior_cfr"] = prior["mean_annual_cfr"]
    df["nat_prior_scale"] = np.log1p(prior["total_attacks"]) / 15.0

    df = df.dropna().reset_index(drop=True)
    return df


def train_models():
    print("=" * 65)
    print("PashuRaksha — Dual-Dataset Unified Livestock ML Training")
    print("=" * 65)

    data = load_and_prepare_data()
    national_priors = load_national_priors()
    print(f"Loaded {len(national_priors)} national disease priors from MOSPI/Dataful.")

    combinations = data[["district_id", "disease_id"]].drop_duplicates().values

    metrics = {}
    total_trained = 0
    failures = 0

    feature_cols = [
        "month", "week_of_year", "lag_1", "lag_2", "lag_3", "lag_4",
        "rolling_mean_4", "rolling_std_4", "nat_prior_cfr", "nat_prior_scale"
    ]

    for district_id, disease_id in combinations:
        subset = data[(data["district_id"] == district_id) & (data["disease_id"] == disease_id)]
        if len(subset) < 10:
            continue

        feat_df = create_features(subset, national_priors)
        if len(feat_df) < 8:
            continue

        X = feat_df[feature_cols].values
        y = feat_df["target"].values

        # 8-week holdout split
        test_size = min(8, max(2, int(len(feat_df) * 0.2)))
        X_train, X_test = X[:-test_size], X[-test_size:]
        y_train, y_test = y[:-test_size], y[-test_size:]

        # Train primary model (HistGBR)
        hgb = HistGradientBoostingRegressor(max_iter=100, random_state=42)
        hgb.fit(X_train, y_train)

        # Train secondary model (XGBoost if available)
        if HAS_XGB:
            xgb = XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.08, random_state=42)
            xgb.fit(X_train, y_train)
            pred_train = 0.6 * hgb.predict(X_train) + 0.4 * xgb.predict(X_train)
            pred_test = 0.6 * hgb.predict(X_test) + 0.4 * xgb.predict(X_test)
        else:
            pred_train = hgb.predict(X_train)
            pred_test = hgb.predict(X_test)

        mae = float(mean_absolute_error(y_test, pred_test))
        rmse = float(np.sqrt(mean_squared_error(y_test, pred_test)))

        key = f"{district_id}_{disease_id}"
        metrics[key] = {
            "district_id": district_id,
            "disease_id": disease_id,
            "holdout_weeks": test_size,
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "features_used": feature_cols,
            "status": "success"
        }

        # Train on full series for binary deployment
        hgb_full = HistGradientBoostingRegressor(max_iter=120, random_state=42)
        hgb_full.fit(X, y)

        model_filename = f"{district_id}_{disease_id}_hgb.pkl"
        with open(os.path.join(MODELS_DIR, model_filename), "wb") as f:
            pickle.dump(hgb_full, f)

        total_trained += 1
        print(f"  [OK] {district_id:12s} | {disease_id:12s} -> MAE: {mae:.2f}, RMSE: {rmse:.2f}")

    # Save metrics
    metrics_path = os.path.join(RESULTS_DIR, "model_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    summary_path = os.path.join(RESULTS_DIR, "training_summary.json")
    summary = {
        "total_models_trained": total_trained,
        "failed_models": failures,
        "avg_mae": round(float(np.mean([m["mae"] for m in metrics.values()])), 3) if metrics else 0.0,
        "avg_rmse": round(float(np.mean([m["rmse"] for m in metrics.values()])), 3) if metrics else 0.0,
        "districts_count": len(set(m["district_id"] for m in metrics.values())),
        "diseases_count": len(set(m["disease_id"] for m in metrics.values())),
        "cross_dataset_enhancement": "Integrated Dataful national priors (CFR + incidence scaling)"
    }
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 65)
    print(f"District Training Complete: {total_trained} models saved, Avg MAE: {summary['avg_mae']}")
    print(f"Metrics saved -> {metrics_path}")
    print("=" * 65)


if __name__ == "__main__":
    train_models()
