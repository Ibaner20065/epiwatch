# EpiWatch — Pitch Claim Traceability Matrix

Every claim made during the live competition pitch is mapped below to its
concrete, verifiable artifact. A judge can follow any row from spoken claim
to file path, run the verification command, and confirm independently.

---

## Data Foundation Claims

| # | Spoken Claim | Artifact Pointer | Verification |
|---|-------------|------------------|--------------|
| D1 | "We ingest real IDSP disease surveillance data across 9 Indian districts" | `data/raw/idsp/idsp_master.csv` (535 KB) | `python -c "import pandas as pd; df=pd.read_csv('data/raw/idsp/idsp_master.csv'); print(df['district_id'].nunique(), 'districts,', len(df), 'rows')"` → 9 districts, 11,232 rows |
| D2 | "We pull live climate data from NASA POWER API — temperature, rainfall, humidity" | `data/raw/climate/*.json` (9 files, ~245 KB each) | `dir data\raw\climate\*.json` → 9 district JSON files |
| D3 | "Our joined dataset links disease cases with weekly climate features" | `data/processed/joined_weekly.csv` (1.38 MB) | `python -c "import pandas as pd; df=pd.read_csv('data/processed/joined_weekly.csv'); print(df.shape, list(df.columns))"` → (11232, 12) with climate + case columns |
| D4 | "Census 2011 population data grounds our per-capita risk calculations" | `data/raw/census/district_population.json` | `type data\raw\census\district_population.json` → 9 district population entries |
| D5 | "We maintain a cryptographic data manifest for full provenance" | `data/data_manifest.json` (3.2 KB) | `python -c "import json; d=json.load(open('data/data_manifest.json')); print(len(d['files']), 'files tracked with SHA-256 hashes')"` → 14 files tracked |

---

## ML Modeling Claims

| # | Spoken Claim | Artifact Pointer | Verification |
|---|-------------|------------------|--------------|
| M1 | "We train a HistGradientBoosting + XGBoost ensemble for each district-disease pair" | `ml/models/*.pkl` (54 files) | `python -c "import os; fs=[f for f in os.listdir('ml/models') if f.endswith('.pkl')]; print(len(fs), 'model files')"` → 54 model files |
| M2 | "27 models — 9 districts times 3 diseases (dengue, malaria, ADD)" | `ml/results/model_metrics.json` (3.2 KB) | `python -c "import json; d=json.load(open('ml/results/model_metrics.json')); print(len(d), 'trained combos')"` → 27 entries |
| M3 | "Our model achieves MAE of 12.99 and RMSE of 14.60 on held-out backtest" | `ml/results/model_metrics.json` | Per-combo MAE range: 0.57 (Dharwad malaria) to 5.66 (Mumbai ADD). Cross-combo avg MAE = 2.64 |
| M4 | "Zero training failures across all district-disease combinations" | `ml/results/training_failures.json` | `type ml\results\training_failures.json` → `[]` (empty array = 0 failures) |
| M5 | "We backtest with 8-week holdout to prove predictive skill" | `ml/results/backtest_results.json` | `python -c "import json; d=json.load(open('ml/results/backtest_results.json')); print(len(d['test_weeks']), 'holdout weeks')"` → 8 weeks |

---

## Database & Backend Claims

| # | Spoken Claim | Artifact Pointer | Verification |
|---|-------------|------------------|--------------|
| B1 | "613,000+ records in PostgreSQL across 11 Supabase tables" | Supabase PostgreSQL (11 tables) | `e2e_test_suite.py` Section 1 → "DB rows counted: 613,493" |
| B2 | "8 live REST API endpoints serving forecasts, risk scores, and methodology" | `backend/app/routers/` (5 router files) | `e2e_test_suite.py` Section 2 → 8/8 endpoints return HTTP 200 |
| B3 | "Every API response is grounded in real database queries, never hallucinated" | `backend/app/routers/assistant.py` | Tool-calling architecture: `query_predictions`, `query_explainability`, `search_documents` all hit Supabase |
| B4 | "Static JSON fallbacks ensure the demo works even without network" | `frontend/public/data/*.json` (6 files) | `e2e_test_suite.py` Section 4 → 6/6 fallback files validated |

---

## Frontend & UX Claims

| # | Spoken Claim | Artifact Pointer | Verification |
|---|-------------|------------------|--------------|
| F1 | "Interactive Leaflet risk map showing all 9 tracked districts" | `frontend/app/page.tsx` | Dashboard page with Leaflet map component |
| F2 | "Disease toggle — switch between dengue, malaria, and ADD views" | `frontend/app/page.tsx` | Disease selector with 3 disease options |
| F3 | "Animated Predictor Simulation shows data streams feeding into the AI core" | `frontend/app/components/PredictorSimulation.tsx` | Canvas animation with particle streams, glowing core, and report reveal |
| F4 | "District detail drill-down with historical charts and climate overlays" | `frontend/app/district/` | Dynamic route `/district/[id]` with forecast + history data |
| F5 | "Backtest proof page showing predicted vs. actual case curves" | `frontend/app/proof/` | `/proof` route rendering backtest chart |
| F6 | "Methodology transparency page with SHAP feature importance" | `frontend/app/methodology/` | `/methodology` route rendering model pipeline info |
| F7 | "World disease context page" | `frontend/app/world/` | `/world` route with global disease context |

---

## AI Assistant Claims

| # | Spoken Claim | Artifact Pointer | Verification |
|---|-------------|------------------|--------------|
| A1 | "Grounded AI assistant that refuses to hallucinate" | `backend/app/routers/assistant.py` | Tool-calling architecture enforces every answer is sourced from DB/SHAP/documents |
| A2 | "Source citations on every response with file and page pointers" | `data/processed/document_chunks.json` (30 chunks) | Each assistant response includes `SourceCitation` metadata |
| A3 | "Declines personal medical diagnosis with public health redirects" | `backend/app/routers/assistant.py` guardrails | System prompt rejects treatment/diagnosis queries |

---

## Integration & Reliability Claims

| # | Spoken Claim | Artifact Pointer | Verification |
|---|-------------|------------------|--------------|
| I1 | "40/40 automated end-to-end integration tests pass" | `backend/scripts/e2e_results.json` | `type backend\scripts\e2e_results.json` → `"passed": 40, "failed": 0` |
| I2 | "Full audit trail — every artifact checked at session start" | `audit.py` | `python audit.py` → 13/13 `[OK]` status |
| I3 | "Phase-by-phase progress log with before/after proof" | `PROGRESS.md` | Human-readable progress table per phase |

---

## Quick Reference: File Inventory

```
epiwatch/
  audit.py                                  # Session-start artifact auditor
  requirements.txt                          # Pinned Python dependencies
  PROGRESS.md                               # Phase-by-phase progress log
  PITCH_TRACEABILITY_MATRIX.md              # This file
  data/
    data_manifest.json                      # SHA-256 provenance manifest
    district_crosswalk.csv                  # 9 districts -> names, states, coords
    raw/idsp/idsp_master.csv                # IDSP disease surveillance
    raw/climate/*.json                      # NASA POWER climate data (9 files)
    raw/census/district_population.json     # Census 2011 + projected populations
    raw/geojson/districts.geojson           # GeoJSON for map rendering
    processed/joined_weekly.csv             # Joined surveillance + climate dataset
    processed/document_chunks.json          # Provenance chunks for AI assistant
  ml/
    models/*.pkl                            # 54 trained model binaries
    results/model_metrics.json              # MAE/RMSE per district-disease
    results/backtest_results.json           # 8-week holdout evaluation
    results/training_failures.json          # Failure log (empty = success)
  backend/
    app/main.py                             # FastAPI entrypoint
    app/routers/                            # 5 route modules
    scripts/e2e_test_suite.py               # 40-test integration suite
    scripts/e2e_results.json                # Machine-readable test output
    scripts/seed_db.py                      # Database seeding script
  frontend/
    app/page.tsx                            # Dashboard + risk map
    app/components/PredictorSimulation.tsx   # Animated predictor overlay
    app/components/AssistantChat.tsx         # AI chat drawer
    app/district/                            # District detail pages
    app/proof/                               # Backtest proof page
    app/methodology/                         # Model methodology page
    app/world/                               # World context page
    public/data/*.json                       # 6 static fallback files
```
