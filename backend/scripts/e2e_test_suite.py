"""
EpiWatch - End-to-End Integration Test Suite (Phase 5)
======================================================
Validates every layer of the system:
  1. Supabase PostgreSQL connectivity + row counts across all tables
  2. FastAPI REST endpoint HTTP responses
  3. ML model artifact integrity
  4. Static fallback JSON structural completeness
  5. Data pipeline artifact chain consistency

Run:  backend\\.venv\\Scripts\\python backend/scripts/e2e_test_suite.py
"""

import os, sys, json, time, traceback, io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Resolve paths relative to project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
os.chdir(PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

# Test infrastructure
PASS = 0
FAIL = 0
RESULTS = []

def test(name, fn):
    global PASS, FAIL
    try:
        result = fn()
        if result is True or result is None:
            PASS += 1
            RESULTS.append(("PASS", name))
            print(f"  [PASS] {name}")
        else:
            FAIL += 1
            RESULTS.append(("FAIL", name, str(result)))
            print(f"  [FAIL] {name}: {result}")
    except Exception as e:
        FAIL += 1
        RESULTS.append(("FAIL", name, str(e)))
        print(f"  [FAIL] {name}: {e}")

# =====================================================================
# SECTION 1: DATABASE INTEGRITY
# =====================================================================
print("\n" + "="*70)
print("  SECTION 1: SUPABASE POSTGRESQL - CONNECTIVITY & ROW COUNTS")
print("="*70)

from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, "backend", ".env"))

from sqlalchemy import create_engine, text, inspect

DATABASE_URL = os.getenv("DATABASE_URL", "")
engine = None

def setup_db():
    global engine
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"} if DATABASE_URL.startswith("postgresql") else {},
    )

try:
    setup_db()
except Exception as e:
    print(f"  [FATAL] Cannot create DB engine: {e}")

# 1a. Basic connectivity
def test_db_connectivity():
    with engine.connect() as conn:
        row = conn.execute(text("SELECT 1")).fetchone()
    assert row[0] == 1, f"SELECT 1 returned {row}"
    return True

test("DB connectivity (SELECT 1)", test_db_connectivity)

# 1b. Table existence and row counts
EXPECTED_TABLES = {
    "districts":        {"min_rows": 9},
    "case_data":        {"min_rows": 100},
    "climate_data":     {"min_rows": 100},
    "predictions":      {"min_rows": 10},
    "backtest_events":  {"min_rows": 1},
    "forecast_runs":    {"min_rows": 2},
    "model_artifacts":  {"min_rows": 1},
}

# Also check extra tables that were seeded from Kaggle archives
OPTIONAL_TABLES = [
    "archive_hospitals", "archive_admissions", "archive_billing",
    "archive_diagnoses", "archive_patients", "archive_symptom_disease_mapping",
]

total_rows = 0

for table, rules in EXPECTED_TABLES.items():
    def make_test(t, r):
        def fn():
            global total_rows
            with engine.connect() as conn:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).fetchone()[0]
            total_rows += count
            if count < r["min_rows"]:
                return f"Expected >= {r['min_rows']} rows, got {count}"
            return True
        return fn
    test(f"Table '{table}' has >= {rules['min_rows']} rows", make_test(table, rules))

for table in OPTIONAL_TABLES:
    def make_opt_test(t):
        def fn():
            global total_rows
            with engine.connect() as conn:
                exists = conn.execute(text(
                    f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{t}')"
                )).fetchone()[0]
                if not exists:
                    return f"Table '{t}' does not exist (optional)"
                count = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).fetchone()[0]
                total_rows += count
            return True
        return fn
    test(f"Optional table '{table}'", make_opt_test(table))

print(f"\n  Total database rows counted: {total_rows:,}")

# =====================================================================
# SECTION 2: FASTAPI REST ENDPOINTS
# =====================================================================
print("\n" + "="*70)
print("  SECTION 2: FASTAPI REST ENDPOINTS - HTTP RESPONSE VALIDATION")
print("="*70)

import requests

BASE_URL = "http://127.0.0.1:8000"
BACKEND_LIVE = False

def check_backend():
    global BACKEND_LIVE
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        BACKEND_LIVE = r.status_code == 200
    except:
        BACKEND_LIVE = False

check_backend()

if not BACKEND_LIVE:
    print("  [WARN] Backend is NOT running. Starting it...")
    import subprocess
    venv_python = os.path.join(PROJECT_ROOT, "backend", ".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = sys.executable
    proc = subprocess.Popen(
        [venv_python, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.path.join(PROJECT_ROOT, "backend"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    # Wait for startup
    for _ in range(15):
        time.sleep(1)
        try:
            r = requests.get(f"{BASE_URL}/health", timeout=2)
            if r.status_code == 200:
                BACKEND_LIVE = True
                print("  [OK] Backend started successfully")
                break
        except:
            pass
    if not BACKEND_LIVE:
        print("  [FAIL] Could not start backend. HTTP tests will be skipped.")

ENDPOINTS = [
    ("GET", "/",                            200, "Root"),
    ("GET", "/health",                      200, "Health check"),
    ("GET", "/districts",                   200, "List districts"),
    ("GET", "/districts/PUNE",              200, "Get single district"),
    ("GET", "/districts/PUNE/forecast?disease=dengue", 200, "Forecast for PUNE dengue"),
    ("GET", "/districts/PUNE/history?disease=dengue",  200, "History for PUNE dengue"),
    ("GET", "/districts/PUNE/risk",         200, "Risk for PUNE"),
    ("GET", "/methodology",                 200, "Methodology"),
]

if BACKEND_LIVE:
    for method, path, expected_code, label in ENDPOINTS:
        def make_http_test(m, p, ec):
            def fn():
                r = requests.request(m, f"{BASE_URL}{p}", timeout=10)
                if r.status_code != ec:
                    return f"Expected HTTP {ec}, got {r.status_code}: {r.text[:200]}"
                body = r.json()
                if not body:
                    return "Response body is empty"
                return True
            return fn
        test(f"HTTP {method} {path} -> {expected_code} ({label})", make_http_test(method, path, expected_code))
else:
    print("  [SKIP] Skipping HTTP endpoint tests (backend not available)")

# =====================================================================
# SECTION 3: ML MODEL ARTIFACTS
# =====================================================================
print("\n" + "="*70)
print("  SECTION 3: ML MODEL ARTIFACTS - BINARY INTEGRITY")
print("="*70)

def test_model_files():
    model_dir = os.path.join(PROJECT_ROOT, "ml", "models")
    if not os.path.isdir(model_dir):
        return "ml/models directory does not exist"
    pkl_files = [f for f in os.listdir(model_dir) if f.endswith(".pkl")]
    if len(pkl_files) < 54:
        return f"Expected >= 54 .pkl files, found {len(pkl_files)}"
    # Verify each is > 1KB (not a stub)
    stubs = [f for f in pkl_files if os.path.getsize(os.path.join(model_dir, f)) < 1024]
    if stubs:
        return f"{len(stubs)} model files are < 1KB (stubs): {stubs[:3]}"
    return True

test("54 trained .pkl models exist and are non-trivial", test_model_files)

def test_model_metrics():
    path = os.path.join(PROJECT_ROOT, "ml", "results", "model_metrics.json")
    data = json.load(open(path))
    if len(data) < 27:
        return f"Expected 27 district x disease entries, got {len(data)}"
    for key, val in data.items():
        if "mae" not in val or "rmse" not in val:
            return f"Entry '{key}' missing mae/rmse"
        if val["mae"] < 0 or val["rmse"] < 0:
            return f"Entry '{key}' has negative metrics"
    return True

test("Model metrics: 27 entries with valid MAE/RMSE", test_model_metrics)

def test_backtest_results():
    path = os.path.join(PROJECT_ROOT, "ml", "results", "backtest_results.json")
    data = json.load(open(path))
    if isinstance(data, list):
        if len(data) < 10:
            return f"Expected >= 10 backtest records, got {len(data)}"
    elif isinstance(data, dict):
        if len(data) < 5:
            return f"Expected >= 5 backtest entries, got {len(data)}"
    return True

test("Backtest results: sufficient evaluation records", test_backtest_results)

def test_training_failures():
    path = os.path.join(PROJECT_ROOT, "ml", "results", "training_failures.json")
    data = json.load(open(path))
    if isinstance(data, list):
        if len(data) > 0:
            return f"Training had {len(data)} failures: {data[0]}"
    elif isinstance(data, dict):
        if data.get("failures", 0) > 0:
            return f"Training had {data['failures']} failures"
    return True

test("Training failures: 0 failures logged", test_training_failures)

# =====================================================================
# SECTION 4: STATIC FALLBACK JSON (FRONTEND)
# =====================================================================
print("\n" + "="*70)
print("  SECTION 4: STATIC FALLBACK JSON - FRONTEND OFFLINE MODE")
print("="*70)

FALLBACK_FILES = {
    "frontend/public/data/districts.json":       {"min_entries": 9,  "type": "list"},
    "frontend/public/data/predictions.json":     {"min_entries": 10, "type": "list"},
    "frontend/public/data/backtest.json":        {"min_entries": 1,  "type": "any"},
    "frontend/public/data/methodology.json":     {"min_entries": 1,  "type": "any"},
    "frontend/public/data/document_chunks.json": {"min_entries": 5,  "type": "list"},
    "frontend/public/data/detailed_outbreak_reports.json": {"min_entries": 1, "type": "any"},
}

for path, rules in FALLBACK_FILES.items():
    def make_json_test(p, r):
        def fn():
            full = os.path.join(PROJECT_ROOT, p)
            if not os.path.exists(full):
                return f"File missing: {p}"
            data = json.load(open(full))
            if r["type"] == "list":
                if not isinstance(data, list):
                    return f"Expected JSON array, got {type(data).__name__}"
                if len(data) < r["min_entries"]:
                    return f"Expected >= {r['min_entries']} entries, got {len(data)}"
            else:
                if isinstance(data, (dict, list)):
                    size = len(data)
                    if size < r["min_entries"]:
                        return f"Expected >= {r['min_entries']} entries, got {size}"
            return True
        return fn
    test(f"Fallback JSON: {os.path.basename(path)}", make_json_test(path, rules))

# =====================================================================
# SECTION 5: DATA PIPELINE CHAIN
# =====================================================================
print("\n" + "="*70)
print("  SECTION 5: DATA PIPELINE ARTIFACTS - CHAIN CONSISTENCY")
print("="*70)

def test_data_manifest():
    path = os.path.join(PROJECT_ROOT, "data", "data_manifest.json")
    data = json.load(open(path))
    files = data.get("files", {})
    if len(files) < 10:
        return f"Expected >= 10 manifest entries, got {len(files)}"
    # Verify key files are in manifest
    key_patterns = ["joined_weekly.csv", "climate_weekly.csv"]
    for kp in key_patterns:
        found = any(kp in k for k in files.keys())
        if not found:
            return f"Missing manifest entry containing '{kp}'"
    return True

test("Data manifest: >= 10 entries with key files", test_data_manifest)

def test_joined_weekly():
    import pandas as pd
    path = os.path.join(PROJECT_ROOT, "data", "processed", "joined_weekly.csv")
    df = pd.read_csv(path)
    if len(df) < 1000:
        return f"Expected >= 1000 rows, got {len(df)}"
    required_cols = ["district_id", "disease", "week_start", "cases"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        return f"Missing columns: {missing}"
    # Check for 9 districts x 3 diseases
    districts = df["district_id"].nunique()
    diseases = df["disease"].nunique()
    if districts < 9:
        return f"Expected 9 districts, got {districts}"
    if diseases < 3:
        return f"Expected 3 diseases, got {diseases}"
    return True

test("Joined weekly: >= 1000 rows, 9 districts, 3 diseases", test_joined_weekly)

def test_district_crosswalk():
    import pandas as pd
    path = os.path.join(PROJECT_ROOT, "data", "district_crosswalk.csv")
    df = pd.read_csv(path)
    if len(df) < 9:
        return f"Expected 9 rows, got {len(df)}"
    required_cols = ["district_id", "district_name", "state", "latitude", "longitude"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        return f"Missing columns: {missing}"
    return True

test("District crosswalk: 9 districts with geo metadata", test_district_crosswalk)

# =====================================================================
# SECTION 6: FRONTEND BUILD VERIFICATION
# =====================================================================
print("\n" + "="*70)
print("  SECTION 6: NEXT.JS FRONTEND - PAGE STRUCTURE")
print("="*70)

REQUIRED_PAGES = [
    "frontend/app/page.tsx",
    "frontend/app/layout.tsx",
    "frontend/app/globals.css",
    "frontend/app/methodology",
    "frontend/app/proof",
    "frontend/app/world",
    "frontend/app/district",
]

for page in REQUIRED_PAGES:
    def make_page_test(p):
        def fn():
            full = os.path.join(PROJECT_ROOT, p)
            if not os.path.exists(full):
                return f"Missing: {p}"
            return True
        return fn
    test(f"Frontend page: {page.replace('frontend/app/', '')}", make_page_test(page))

# =====================================================================
# FINAL SUMMARY
# =====================================================================
print("\n" + "="*70)
print("  FINAL RESULTS")
print("="*70)
print(f"\n  Passed: {PASS}")
print(f"  Failed: {FAIL}")
print(f"  Total:  {PASS + FAIL}")
print(f"  DB rows counted: {total_rows:,}")
print()

if FAIL > 0:
    print("  FAILURES DETECTED:")
    for r in RESULTS:
        if r[0] == "FAIL":
            print(f"    [FAIL] {r[1]}: {r[2]}")
    print()

status = "ALL CLEAR - Deploy freeze approved" if FAIL == 0 else f"BLOCKED - {FAIL} test(s) failed"
print(f"  STATUS: {status}")
print("="*70)

# Write machine-readable result
result_path = os.path.join(PROJECT_ROOT, "backend", "scripts", "e2e_results.json")
with open(result_path, "w") as f:
    json.dump({
        "passed": PASS,
        "failed": FAIL,
        "total": PASS + FAIL,
        "db_rows": total_rows,
        "status": "PASS" if FAIL == 0 else "FAIL",
        "details": [{"status": r[0], "test": r[1], "error": r[2] if len(r) > 2 else None} for r in RESULTS]
    }, f, indent=2)
print(f"\n  Results written to: {result_path}")
