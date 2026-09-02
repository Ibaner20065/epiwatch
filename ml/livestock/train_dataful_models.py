"""
Dataful / MOSPI National Livestock Disease Machine Learning Pipeline
====================================================================
Trains multi-target ensemble forecasting models (HistGradientBoosting + XGBoost)
for 37 Indian livestock diseases across:
  - Outbreaks (cluster events)
  - Attacks (total cases / infections)
  - Deaths (mortality counts)

Outputs:
  - ml/livestock/models/dataful/*.pkl
  - ml/livestock/results/dataful_model_metrics.json
  - ml/livestock/results/dataful_forecasts_2016_2026.json
  - ml/livestock/results/dataful_training_summary.json
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROCESSED_DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "dataful_livestock_annual.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models", "dataful")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


def create_time_series_features(df_disease, target_col):
    """
    Creates autoregressive temporal lag and rolling statistics features
    for annual disease incidence series.
    """
    df = df_disease.copy().sort_values("fiscal_year").reset_index(drop=True)
    df["target"] = df[target_col].astype(float)
    df["year_idx"] = df["fiscal_year"] - df["fiscal_year"].min()

    # Lags
    df["lag_1"] = df["target"].shift(1)
    df["lag_2"] = df["target"].shift(2)
    df["lag_3"] = df["target"].shift(3)

    # Rolling statistics
    df["rolling_mean_3"] = df["target"].shift(1).rolling(3, min_periods=1).mean()
    df["rolling_std_3"] = df["target"].shift(1).rolling(3, min_periods=1).std().fillna(0.0)
    df["rolling_max_3"] = df["target"].shift(1).rolling(3, min_periods=1).max()

    # Secondary cross-series features
    if target_col == "attacks":
        df["aux_lag_1"] = df["outbreaks"].shift(1).fillna(0.0)
    elif target_col == "deaths":
        df["aux_lag_1"] = df["attacks"].shift(1).fillna(0.0)
    else:  # outbreaks
        df["aux_lag_1"] = df["attacks"].shift(1).fillna(0.0)

    # Fill remaining NaNs from early lag shifts with backward fill
    df = df.bfill().reset_index(drop=True)
    return df


def forecast_future_horizons(model, last_known_row, feature_cols, target_col, years_ahead=11):
    """
    Iterative autoregressive multi-horizon forecasting from 2016 through 2026.
    """
    forecasts = []
    current_row = last_known_row.copy()
    hist_values = [current_row["lag_2"], current_row["lag_1"], current_row["target"]]

    start_year = int(current_row["fiscal_year"])
    for step in range(1, years_ahead + 1):
        target_year = start_year + step
        year_idx = current_row["year_idx"] + step

        lag_1 = hist_values[-1]
        lag_2 = hist_values[-2] if len(hist_values) >= 2 else lag_1
        lag_3 = hist_values[-3] if len(hist_values) >= 3 else lag_2

        last_3 = hist_values[-3:]
        rolling_mean = float(np.mean(last_3))
        rolling_std = float(np.std(last_3)) if len(last_3) > 1 else 0.0
        rolling_max = float(np.max(last_3))

        feat_vector = np.array([[
            year_idx, lag_1, lag_2, lag_3, rolling_mean, rolling_std, rolling_max, lag_1 * 0.8
        ]])

        pred_val = float(model.predict(feat_vector)[0])
        pred_val = max(0.0, pred_val)  # non-negative constraint
        
        # Uncertainty intervals (+- 15% + rolling std)
        ci_lower = max(0.0, round(pred_val * 0.82 - rolling_std * 0.5, 1))
        ci_upper = round(pred_val * 1.18 + rolling_std * 0.5, 1)

        forecasts.append({
            "fiscal_year": target_year,
            "predicted_value": round(pred_val, 2),
            "ci_lower": ci_lower,
            "ci_upper": ci_upper
        })

        hist_values.append(pred_val)

    return forecasts


def train_dataful_pipeline():
    print("=" * 70)
    print("Training National Livestock Ensemble Models (MOSPI / Dataful 37 Diseases)")
    print("=" * 70)

    if not os.path.exists(PROCESSED_DATA_PATH):
        raise FileNotFoundError(f"Processed dataset not found at {PROCESSED_DATA_PATH}")

    df = pd.read_csv(PROCESSED_DATA_PATH)
    diseases = df["disease"].unique()
    print(f"Total Unique Diseases: {len(diseases)}")

    targets = ["attacks", "outbreaks", "deaths"]
    feature_cols = ["year_idx", "lag_1", "lag_2", "lag_3", "rolling_mean_3", "rolling_std_3", "rolling_max_3", "aux_lag_1"]

    metrics_dict = {}
    forecasts_dict = {}
    total_trained = 0
    all_maes = []
    all_rmses = []

    for disease_name in sorted(diseases):
        sub = df[df["disease"] == disease_name].sort_values("fiscal_year").reset_index(drop=True)
        if len(sub) < 5:
            continue

        slug = sub["disease_slug"].iloc[0]
        metrics_dict[slug] = {
            "name": disease_name,
            "slug": slug,
            "targets": {}
        }
        forecasts_dict[slug] = {
            "name": disease_name,
            "slug": slug,
            "historical": sub[["fiscal_year", "attacks", "outbreaks", "deaths", "case_fatality_rate"]].to_dict(orient="records"),
            "forecasts": {}
        }

        for target_col in targets:
            feat_df = create_time_series_features(sub, target_col)
            
            X = feat_df[feature_cols].values
            y = feat_df["target"].values

            # Time Series Split: Holdout last 2 years (2014, 2015)
            test_size = 2
            X_train, X_test = X[:-test_size], X[-test_size:]
            y_train, y_test = y[:-test_size], y[-test_size:]

            # Primary: HistGradientBoostingRegressor
            hgb = HistGradientBoostingRegressor(
                max_iter=60,
                min_samples_leaf=2,
                l2_regularization=0.5,
                random_state=42
            )
            hgb.fit(X_train, y_train)

            # Secondary: XGBoost if available
            if HAS_XGB:
                xgb_model = XGBRegressor(
                    n_estimators=30,
                    max_depth=2,
                    learning_rate=0.08,
                    reg_lambda=1.0,
                    random_state=42
                )
                xgb_model.fit(X_train, y_train)
                
                class EnsembleModel:
                    def __init__(self, m1, m2):
                        self.m1 = m1
                        self.m2 = m2
                    def predict(self, X_input):
                        return 0.65 * self.m1.predict(X_input) + 0.35 * self.m2.predict(X_input)
                
                ensemble = EnsembleModel(hgb, xgb_model)
            else:
                ensemble = hgb

            # Evaluate on holdout
            y_pred_test = ensemble.predict(X_test)
            y_pred_train = ensemble.predict(X_train)

            mae = float(mean_absolute_error(y_test, y_pred_test))
            rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
            
            # Non-negative safe MAPE
            denom = np.where(y_test > 0, y_test, 1.0)
            mape = float(np.mean(np.abs(y_test - y_pred_test) / denom) * 100.0)

            all_maes.append(mae)
            all_rmses.append(rmse)

            # Fit on all historical data for final deployment
            hgb_full = HistGradientBoostingRegressor(
                max_iter=70,
                min_samples_leaf=2,
                l2_regularization=0.5,
                random_state=42
            )
            hgb_full.fit(X, y)

            if HAS_XGB:
                xgb_full = XGBRegressor(
                    n_estimators=35,
                    max_depth=2,
                    learning_rate=0.08,
                    reg_lambda=1.0,
                    random_state=42
                )
                xgb_full.fit(X, y)
                full_model = EnsembleModel(hgb_full, xgb_full)
            else:
                full_model = hgb_full

            # Future Extrapolation: 2016 through 2026
            last_row = feat_df.iloc[-1]
            future_fc = forecast_future_horizons(full_model, last_row, feature_cols, target_col, years_ahead=11)
            forecasts_dict[slug]["forecasts"][target_col] = future_fc

            # Save model binary
            model_file = f"{slug}_{target_col}_ensemble.pkl"
            with open(os.path.join(MODELS_DIR, model_file), "wb") as f:
                pickle.dump(full_model, f)

            metrics_dict[slug]["targets"][target_col] = {
                "holdout_mae": round(mae, 2),
                "holdout_rmse": round(rmse, 2),
                "holdout_mape_pct": round(mape, 2),
                "train_samples": len(X_train),
                "test_samples": len(X_test),
                "model_binary": model_file,
                "holdout_actuals": [round(float(v), 2) for v in y_test],
                "holdout_predictions": [round(float(v), 2) for v in y_pred_test]
            }

            total_trained += 1

        print(f"  [OK] {disease_name[:32]:32s} -> Trained 3 targets (Attacks MAE: {metrics_dict[slug]['targets']['attacks']['holdout_mae']})")

    # Save Results
    metrics_path = os.path.join(RESULTS_DIR, "dataful_model_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_dict, f, indent=2)

    forecasts_path = os.path.join(RESULTS_DIR, "dataful_forecasts_2016_2026.json")
    with open(forecasts_path, "w", encoding="utf-8") as f:
        json.dump(forecasts_dict, f, indent=2)

    summary = {
        "total_diseases": len(metrics_dict),
        "total_models_saved": total_trained,
        "average_holdout_mae": round(float(np.mean(all_maes)), 2) if all_maes else 0.0,
        "average_holdout_rmse": round(float(np.mean(all_rmses)), 2) if all_rmses else 0.0,
        "forecast_horizons": "2016 - 2026 (11 years)",
        "features_used": feature_cols,
        "ensemble_components": ["HistGradientBoostingRegressor", "XGBRegressor" if HAS_XGB else "None"],
        "generated_at": pd.Timestamp.now().isoformat()
    }

    summary_path = os.path.join(RESULTS_DIR, "dataful_training_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 70)
    print(f"Training Complete: {total_trained} Model Ensembles Saved across {len(metrics_dict)} Diseases!")
    print(f"Average Holdout MAE: {summary['average_holdout_mae']}")
    print(f"Metrics Saved -> {metrics_path}")
    print(f"Forecasts Saved -> {forecasts_path}")
    print("=" * 70)
    return metrics_dict, summary


if __name__ == "__main__":
    train_dataful_pipeline()
