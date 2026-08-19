<p align="center">
  <img src="https://img.shields.io/badge/EpiWatch-AI%20Disease%20Surveillance-00d4aa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white" alt="EpiWatch" height="40"/>
</p>

<h1 align="center">EpiWatch</h1>
<h3 align="center">AI-Powered Multi-Disease Outbreak Prediction System for India</h3>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/fastapi-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/supabase-postgresql-3FCF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/models-54%20trained-ff6b6b?style=flat-square" />
  <img src="https://img.shields.io/badge/tests-40%2F40%20pass-00d4aa?style=flat-square" />
  <img src="https://img.shields.io/badge/db%20records-613%2C493-7c3aed?style=flat-square" />
</p>

<p align="center">
  <strong>Real-time disease outbreak prediction</strong> combining IDSP surveillance data, NASA POWER climate feeds, and Census demographics through a <strong>HistGradientBoosting + XGBoost ensemble</strong> — serving 9 Indian districts across 3 diseases with grounded AI explainability.
</p>

---

## The Problem

India's disease surveillance system (IDSP) generates weekly reports, but by the time outbreaks are detected through traditional reporting, they've already spread. **There is no public, district-level early warning system** that combines climate triggers (monsoon rainfall, temperature spikes, humidity) with historical case patterns to predict outbreaks *before* they peak.

## What EpiWatch Does

EpiWatch closes this gap with a **complete prediction pipeline** — from raw data ingestion to interactive risk maps — that predicts disease outbreaks **weeks in advance** by learning the climate–disease relationship for each district.

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  IDSP Cases  │───▶│   ETL Join   │───▶│  ML Ensemble │───▶│  Risk Maps   │
│  NASA POWER  │    │  + Climate   │    │  HGB + XGB   │    │  + Forecasts │
│  Census 2011 │    │  + Census    │    │  27 models   │    │  + AI Chat   │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## Features

### 🗺️ Interactive Risk Map
Real-time Leaflet map of India with color-coded risk tiers (Low → Medium → High → Critical) for all 9 tracked districts. Click any district to drill into forecasts, historical trends, and climate overlays.

### 🔬 ML Ensemble Forecasting
**54 trained models** (HistGradientBoosting baseline + XGBoost residual correction) for every district–disease combination. Each model ingests temperature, rainfall, humidity, and historical case lag features.

### 📊 Backtest Proof
8-week holdout backtest showing predicted vs. actual case curves. Every prediction claim is auditable against `ml/results/backtest_results.json`.

### 🤖 Grounded AI Assistant
Claude-powered conversational interface that **refuses to hallucinate** — every response is grounded in real Supabase queries, SHAP feature attributions, and Census provenance chunks. Includes source citations on every answer.

### 🎬 Predictor Simulation
Animated data-stream visualization showing data flowing from sensors into the AI prediction core, with a dramatic reveal of outbreak risk reports.

### 📋 Full Audit Trail
Cryptographic data manifest (`SHA-256` hashes), session-start audit script, and a 24-claim pitch traceability matrix mapping every presentation claim to a verifiable artifact.

---

## Architecture

```
epiwatch/
├── backend/                    # FastAPI REST API (Python 3.12)
│   ├── app/
│   │   ├── main.py             # FastAPI app with CORS + 5 route modules
│   │   ├── config.py           # Environment variable loader
│   │   ├── db.py               # SQLAlchemy engine + Supabase connection
│   │   ├── models.py           # ORM models (District, CaseData, ClimateData, etc.)
│   │   ├── schemas.py          # Pydantic response schemas
│   │   └── routers/
│   │       ├── districts.py    # GET /districts, /districts/{id}
│   │       ├── predictions.py  # GET /districts/{id}/forecast, /history, /risk
│   │       ├── backtest.py     # GET /backtest/{event_id}
│   │       ├── methodology.py  # GET /methodology
│   │       └── assistant.py    # POST /assistant/query (grounded AI)
│   └── scripts/
│       ├── seed_db.py          # Seed Supabase with all datasets
│       └── e2e_test_suite.py   # 40-test integration runner
│
├── frontend/                   # Next.js 15 Dashboard (TypeScript)
│   ├── app/
│   │   ├── page.tsx            # Dashboard: risk map + disease toggles
│   │   ├── district/           # /district/[id] — drill-down with charts
│   │   ├── proof/              # /proof — backtest predicted vs. actual
│   │   ├── methodology/        # /methodology — model pipeline transparency
│   │   ├── world/              # /world — global disease context
│   │   └── components/
│   │       ├── IndiaMap.tsx     # Leaflet risk map
│   │       ├── ForecastChart.tsx
│   │       ├── BacktestChart.tsx
│   │       ├── RiskBadge.tsx
│   │       ├── WorldMap.tsx
│   │       ├── PredictorSimulation.tsx  # Animated AI prediction overlay
│   │       └── AssistantChat.tsx        # Grounded AI chat drawer
│   └── public/data/            # Static JSON fallbacks (offline mode)
│
├── ml/                         # Machine Learning Pipeline
│   ├── models/                 # 54 .pkl trained model binaries
│   ├── results/
│   │   ├── model_metrics.json  # MAE/RMSE per district-disease
│   │   ├── backtest_results.json
│   │   └── training_failures.json
│   └── scripts/                # Training & evaluation scripts
│
├── data/
│   ├── data_manifest.json      # SHA-256 provenance manifest
│   ├── district_crosswalk.csv  # 9 districts → names, states, coordinates
│   ├── raw/
│   │   ├── idsp/               # IDSP disease surveillance CSVs
│   │   ├── climate/            # NASA POWER API JSON responses
│   │   ├── census/             # Census 2011 population data
│   │   └── geojson/            # District boundary GeoJSON
│   └── processed/
│       ├── joined_weekly.csv   # Joined surveillance + climate dataset
│       └── document_chunks.json # AI assistant provenance chunks
│
├── audit.py                    # Session-start artifact auditor
├── requirements.txt            # Python dependencies (pinned)
├── PROGRESS.md                 # Phase-by-phase completion log
└── PITCH_TRACEABILITY_MATRIX.md # 24-claim pitch → artifact → proof
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15, TypeScript, Leaflet, Recharts | Interactive dashboard & maps |
| **Backend** | FastAPI 0.115, SQLAlchemy 2.0 | REST API serving predictions |
| **Database** | Supabase PostgreSQL | 613,493 records across 11 tables |
| **ML** | scikit-learn (HistGBR), XGBoost, Prophet | Ensemble disease forecasting |
| **AI** | Claude (tool-calling) | Grounded conversational assistant |
| **Climate** | NASA POWER API | Temperature, rainfall, humidity feeds |
| **Surveillance** | IDSP + Kaggle datasets | Weekly district-level case data |

---

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- Supabase account (or PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/Ibaner20065/epiwatch.git
cd epiwatch

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r ../requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# backend/.env
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/postgres?sslmode=require
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NASA_API_KEY=your-nasa-key
FRONTEND_ORIGIN=http://localhost:3000
```

### 3. Seed Database & Train Models

```bash
# From project root
backend\.venv\Scripts\python backend/scripts/seed_db.py
backend\.venv\Scripts\python ml/scripts/train.py
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard and [http://localhost:8000/docs](http://localhost:8000/docs) for the API docs.

### 5. Verify

```bash
# Run audit (from project root)
python audit.py

# Run full integration test suite
backend\.venv\Scripts\python backend/scripts/e2e_test_suite.py
```

---

## Data Sources

| Source | What | Coverage |
|--------|------|---------|
| **IDSP** (Integrated Disease Surveillance Programme) | Weekly district-level disease cases & deaths | 9 districts, 3 diseases, 104 weeks |
| **NASA POWER** | Daily temperature (T2M), precipitation (PRECTOTCORR), humidity (RH2M) | 2023–2025, per district centroid |
| **Census 2011** | District populations + 2025 projections | 9 districts |
| **Kaggle** (Hospital Analytics) | Hospital admissions, billing, diagnoses, patient records | 598K+ records |

---

## Tracked Districts

| District | State | Diseases Tracked |
|----------|-------|-----------------|
| Bengaluru Urban | Karnataka | Dengue, Malaria, ADD |
| Dharwad | Karnataka | Dengue, Malaria, ADD |
| Mysuru | Karnataka | Dengue, Malaria, ADD |
| Mumbai | Maharashtra | Dengue, Malaria, ADD |
| Pune | Maharashtra | Dengue, Malaria, ADD |
| Nagpur | Maharashtra | Dengue, Malaria, ADD |
| Kolkata | West Bengal | Dengue, Malaria, ADD |
| Howrah | West Bengal | Dengue, Malaria, ADD |
| North 24 Parganas | West Bengal | Dengue, Malaria, ADD |

---

## Model Performance

**Ensemble**: HistGradientBoostingRegressor (seasonality baseline) + XGBRegressor (climate residual correction)

| District | Dengue MAE | Malaria MAE | ADD MAE |
|----------|-----------|-------------|---------|
| Bengaluru Urban | 4.39 | 2.81 | 5.52 |
| Dharwad | 0.85 | 0.57 | 1.13 |
| Howrah | 2.10 | 1.07 | 2.72 |
| Kolkata | 2.07 | 1.81 | 3.11 |
| Mumbai | 3.94 | 2.70 | 5.66 |
| Mysuru | 1.32 | 0.81 | 1.72 |
| Nagpur | 1.76 | 1.24 | 2.44 |
| North 24 Parganas | 3.36 | 1.91 | 4.17 |
| Pune | 3.96 | 2.17 | 4.12 |

**Training**: 27/27 successful (0 failures). **Backtest**: 8-week holdout evaluation.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check + DB connectivity |
| `GET` | `/districts` | List all 9 tracked districts |
| `GET` | `/districts/{id}` | Single district metadata |
| `GET` | `/districts/{id}/forecast?disease=` | 8-week disease forecast |
| `GET` | `/districts/{id}/history?disease=` | Historical cases + climate |
| `GET` | `/districts/{id}/risk` | Risk tier by disease |
| `GET` | `/methodology` | Model pipeline + SHAP importance |
| `GET` | `/backtest/{id}` | Backtest event details |
| `POST` | `/assistant/query` | Grounded AI assistant |

---

## Integration Tests

```
40/40 PASS — Deploy freeze approved

Section 1: Supabase PostgreSQL .... 12/12 (613,493 rows across 11 tables)
Section 2: FastAPI REST Endpoints . 8/8  (all routes HTTP 200)
Section 3: ML Model Artifacts ..... 4/4  (54 .pkl, 27 metrics, 0 failures)
Section 4: Static Fallback JSON ... 6/6  (6 offline fallback files)
Section 5: Data Pipeline Chain .... 3/3  (manifest, joined data, crosswalk)
Section 6: Next.js Frontend ....... 7/7  (all pages/routes present)
```

---

## Project Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Data Ingestion & ETL (IDSP + NASA + Census) | ✅ Complete |
| 2 | ML Modeling (HGB + XGBoost ensemble, 54 models) | ✅ Complete |
| 3 | FastAPI Backend & Supabase Seeding (613K records) | ✅ Complete |
| 4 | Next.js Frontend (Risk map, charts, simulation) | ✅ Complete |
| 5 | Integration Test & Deploy Freeze (40/40 pass) | ✅ Complete |
| 6 | Conversational Intelligence (Grounded AI assistant) | ✅ Complete |

---

## License

This project is licensed under the [MIT License](LICENSE).


---

<p align="center">
  Built with data from <strong>IDSP</strong>, <strong>NASA POWER</strong>, and <strong>Census 2011</strong><br/>
  <sub>EpiWatch — Predicting outbreaks before they peak</sub>
</p>
