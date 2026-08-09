# audit.py — run this first, every session, before writing new code
import os, json

def check(path, label, min_size_bytes=1):
    exists = os.path.exists(path)
    size_ok = exists and os.path.getsize(path) > min_size_bytes
    status = "OK" if size_ok else ("EMPTY/STUB" if exists else "MISSING")
    print(f"[{status:10}] {label:45} -> {path}")
    return status

print("=== ENVIRONMENT ===")
check("requirements.txt", "Python dependencies pinned")

print("\n=== PHASE 1: DATA ===")
check("data/data_manifest.json", "Data manifest")
check("data/district_crosswalk.csv", "District name crosswalk")
check("data/processed/joined_weekly.csv", "Joined weekly dataset", min_size_bytes=1000)

print("\n=== PHASE 2: MODELING ===")
model_dir = "ml/models"
if os.path.isdir(model_dir):
    pkl_files = [f for f in os.listdir(model_dir) if f.endswith(".pkl")]
    print(f"[{'OK' if pkl_files else 'MISSING':10}] Trained model files{'':30} -> {len(pkl_files)} found")
else:
    print(f"[MISSING   ] ml/models directory does not exist")
check("ml/results/model_metrics.json", "Model accuracy metrics (MAE/RMSE)")
check("ml/results/backtest_results.json", "Backtest predicted-vs-actual")
check("ml/results/training_failures.json", "Training failure log")

print("\n=== PHASE 3: BACKEND & DB ===")
check("backend/main.py", "FastAPI app entrypoint")
check("backend/scripts/seed_db.py", "DB seed script")
check("backend/API_TEST_LOG.md", "Real endpoint test log")

print("\n=== PHASE 4: FRONTEND ===")
check("frontend/app", "Next.js app directory")
check("PROGRESS.md", "Running phase-by-phase progress log")

print("\nAudit complete. See status codes above.")
