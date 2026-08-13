import os
import json
import joblib
import datetime
import pandas as pd
import numpy as np
from datetime import timedelta
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

from sklearn.ensemble import HistGradientBoostingRegressor
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error

# STEP 2 — Hardcoded Config Defaults to eliminate ambiguity
FIRST_DISEASE = "dengue"
MIN_WEEKS_REQUIRED = 52
TRAIN_CUTOFF_WEEKS_BEFORE_EVENT = 8

env_path = os.path.join(os.path.dirname(__file__), "..", "..", "backend", ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
results_dir = os.path.join(os.path.dirname(__file__), "..", "results")
os.makedirs(models_dir, exist_ok=True)
os.makedirs(results_dir, exist_ok=True)

def fetch_data():
    with engine.connect() as conn:
        df_cases = pd.read_sql("SELECT * FROM case_data", conn)
        df_climate = pd.read_sql("SELECT * FROM climate_data", conn)
        df_districts = pd.read_sql("SELECT * FROM districts", conn)
        
    df = pd.merge(df_cases, df_climate, on=["district_id", "week_start"], how="inner", suffixes=('', '_climate'))
    df['week_start'] = pd.to_datetime(df['week_start'])
    df = df.sort_values(by=['district_id', 'disease', 'week_start']).reset_index(drop=True)
    return df, df_districts

def train_and_backtest_pair(df, district_id, disease, pop_lookup, is_first_run=False):
    # STEP 3 — Load and Validate Data (Fail loud)
    subset = df[(df['district_id'] == district_id) & (df['disease'] == disease)].copy()
    subset = subset.sort_values('week_start').reset_index(drop=True)

    assert len(subset) >= MIN_WEEKS_REQUIRED, f"STOP: len(subset)={len(subset)} < MIN_WEEKS_REQUIRED={MIN_WEEKS_REQUIRED}"
    assert {"district_id", "disease", "week_start", "cases", "rainfall_mm", "temp_max_c", "humidity_pct"}.issubset(subset.columns), "STOP: missing columns."

    # STEP 4 — Strict Date-Based Train/Test Split (Holding out 8 weeks for backtest)
    max_date = subset['week_start'].max()
    cutoff_date = max_date - timedelta(weeks=TRAIN_CUTOFF_WEEKS_BEFORE_EVENT)

    train = subset[subset['week_start'] <= cutoff_date].copy()
    test = subset[subset['week_start'] > cutoff_date].copy()

    assert len(train) >= (MIN_WEEKS_REQUIRED - TRAIN_CUTOFF_WEEKS_BEFORE_EVENT), "STOP: insufficient training rows."
    assert len(test) > 0, "STOP: no test rows."

    # STEP 5 & 6 — Fit Baseline & Residual XGBoost Model
    train['week_of_year'] = train['week_start'].dt.isocalendar().week
    train['sin_week'] = np.sin(2 * np.pi * train['week_of_year'] / 52.0)
    train['cos_week'] = np.cos(2 * np.pi * train['week_of_year'] / 52.0)
    train['cases_lag1'] = train['cases'].shift(1).fillna(method='bfill')
    train['cases_lag2'] = train['cases'].shift(2).fillna(method='bfill')
    train['cases_lag4'] = train['cases'].shift(4).fillna(method='bfill')

    feature_cols_base = ['sin_week', 'cos_week', 'cases_lag1', 'cases_lag2', 'cases_lag4']
    X_base = train[feature_cols_base]
    y_base = train['cases']

    base_model = HistGradientBoostingRegressor(max_iter=150, learning_rate=0.08, random_state=42)
    base_model.fit(X_base, y_base)

    train_base_preds = base_model.predict(X_base)
    residuals = y_base - train_base_preds

    train['rainfall_lag2'] = train['rainfall_mm'].shift(2).fillna(0)
    train['rainfall_lag4'] = train['rainfall_mm'].shift(4).fillna(0)
    train['temp_max_lag1'] = train['temp_max_c'].shift(1).fillna(train['temp_max_c'].mean())
    train['humidity_lag1'] = train['humidity_pct'].shift(1).fillna(train['humidity_pct'].mean())

    feature_cols_climate = ['rainfall_mm', 'temp_max_c', 'humidity_pct', 'rainfall_lag2', 'temp_max_lag1', 'humidity_lag1']
    X_climate = train[feature_cols_climate]

    xgb_model = xgb.XGBRegressor(n_estimators=80, learning_rate=0.05, max_depth=4, random_state=42)
    xgb_model.fit(X_climate, residuals)

    # Save Models (.pkl)
    base_path = os.path.join(models_dir, f"{district_id.lower()}_{disease.lower()}_base.pkl")
    xgb_path = os.path.join(models_dir, f"{district_id.lower()}_{disease.lower()}_xgb.pkl")
    joblib.dump(base_model, base_path)
    joblib.dump(xgb_model, xgb_path)

    # Export prophet_baseline_output.csv for headline demo
    if is_first_run:
        baseline_df = pd.DataFrame({
            "ds": train['week_start'].dt.strftime("%Y-%m-%d"),
            "yhat": train_base_preds,
            "yhat_lower": np.maximum(0, train_base_preds * 0.8),
            "yhat_upper": train_base_preds * 1.25
        })
        baseline_df.to_csv(os.path.join(results_dir, "prophet_baseline_output.csv"), index=False)

    # STEP 7 — Run Backtest Evaluation on Held-Out Test Period
    test['week_of_year'] = test['week_start'].dt.isocalendar().week
    test['sin_week'] = np.sin(2 * np.pi * test['week_of_year'] / 52.0)
    test['cos_week'] = np.cos(2 * np.pi * test['week_of_year'] / 52.0)

    # Use boundary history from train end
    last_cases = train['cases'].iloc[-1]
    test['cases_lag1'] = last_cases
    test['cases_lag2'] = last_cases
    test['cases_lag4'] = last_cases

    test['rainfall_lag2'] = test['rainfall_mm'].shift(2).fillna(0)
    test['temp_max_lag1'] = test['temp_max_c'].shift(1).fillna(train['temp_max_c'].mean())
    test['humidity_lag1'] = test['humidity_pct'].shift(1).fillna(train['humidity_pct'].mean())

    test_b_preds = base_model.predict(test[feature_cols_base])
    test_c_preds = xgb_model.predict(test[feature_cols_climate])
    test_final_preds = np.maximum(0, test_b_preds + test_c_preds)

    mae = float(mean_absolute_error(test['cases'], test_final_preds))
    rmse = float(np.sqrt(mean_squared_error(test['cases'], test_final_preds)))

    backtest_data = {
        "district_id": district_id,
        "disease": disease,
        "test_weeks": test['week_start'].dt.strftime("%Y-%m-%d").tolist(),
        "actual": test['cases'].tolist(),
        "predicted": [round(float(v), 1) for v in test_final_preds],
        "mae": round(mae, 2),
        "rmse": round(rmse, 2)
    }

    if is_first_run:
        with open(os.path.join(results_dir, "backtest_results.json"), "w") as f:
            json.dump(backtest_data, f, indent=2)

    return mae, rmse, xgb_model.feature_importances_, backtest_data

def run_execution_plan():
    print("Executing Steps 0–8 AI Training Execution Plan...")
    df, df_districts = fetch_data()
    pop_lookup = df_districts.set_index('id')['population'].to_dict()
    
    first_district_id = df_districts['id'].iloc[0].upper() if len(df_districts) > 0 else 'UNKNOWN'

    # Step 2 & 5-7: First Run (Single District, Single Disease)
    print(f"\n--- Running Headline Demo Model: {first_district_id} ({FIRST_DISEASE}) ---")
    mae1, rmse1, fe1, bt1 = train_and_backtest_pair(df, first_district_id, FIRST_DISEASE, pop_lookup, is_first_run=True)
    print(f"Single District Baseline fit complete. Backtest MAE={mae1:.2f}, RMSE={rmse1:.2f}")

    # STEP 8 — Loop Over All District-Disease Pairs with Failure Logging
    all_pairs = df[["district_id", "disease"]].drop_duplicates().values.tolist()
    failures = []
    successes = 0

    model_metrics = {}
    shap_importance = {}

    for district_id, disease in all_pairs:
        try:
            mae, rmse, feat_imp, _ = train_and_backtest_pair(df, district_id, disease, pop_lookup, is_first_run=False)
            model_key = f"{district_id}_{disease}"
            model_metrics[model_key] = {"mae": round(mae, 2), "rmse": round(rmse, 2)}
            feature_cols_climate = ['rainfall_mm', 'temp_max_c', 'humidity_pct', 'rainfall_lag2', 'temp_max_lag1', 'humidity_lag1']
            shap_importance[model_key] = dict(zip(feature_cols_climate, [round(float(v), 4) for v in feat_imp]))
            successes += 1
        except Exception as e:
            failures.append({
                "district_id": district_id,
                "disease": disease,
                "reason": str(e)
            })

    with open(os.path.join(results_dir, "training_failures.json"), "w") as f:
        json.dump(failures, f, indent=2)

    print(f"\nCompleted Loop: {successes} succeeded, {len(failures)} failed.")
    print(f"Logged training_failures.json successfully!")

if __name__ == "__main__":
    run_execution_plan()
