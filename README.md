<p align="center">
  <img src="https://img.shields.io/badge/EpiWatch-AI%20Disease%20Surveillance-00d4aa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white" alt="EpiWatch" height="40"/>
</p>

<h1 align="center">EpiWatch + PashuRaksha (पशुरक्षा)</h1>
<h3 align="center">AI-Powered Multi-Disease & One-Health Outbreak Prediction Platform for India</h3>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/fastapi-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/database-PostgreSQL%20%7C%20SQLite-3FCF8E?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/models-200%2B%20trained-ff6b6b?style=flat-square" />
  <img src="https://img.shields.io/badge/tests-pass-00d4aa?style=flat-square" />
  <img src="https://img.shields.io/badge/one--health-Human%20%2B%20Livestock-d4af37?style=flat-square" />
</p>

<p align="center">
  <strong>Comprehensive epidemiological intelligence</strong> bridging human disease forecasting, national livestock outbreak surveillance, and clinical triage. Ingests IDSP surveillance, MOSPI national disease records, NASA POWER climate feeds, and Census demographics through <strong>HistGradientBoosting + XGBoost ensembles</strong> with grounded AI explainability.
</p>

---

## 📌 The Problem & Vision

Traditional disease monitoring systems in India operate reactively — by the time outbreak clusters are collated through conventional health registers, pathogens have already spread across communities and herds.

**EpiWatch + PashuRaksha** solves this with a proactive, **One-Health early-warning system**:
1. **Human Epidemiology (EpiWatch)**: Combines weather drivers (monsoon precipitation, temperature, relative humidity) with historical IDSP incidence to forecast human vector-borne and water-borne outbreaks weeks ahead.
2. **National & State Animal Health (PashuRaksha & MOSPI/Dataful)**: Integrates 11 years of official national incidence records across 37 livestock diseases with district-level veterinary surveillance across Maharashtra to forecast attacks, outbreaks, and mortality through 2026.
3. **Clinical & Symptom Triage**: Employs multi-label NLP and Gradient Boosting classification to triage natural-language symptoms into suspected diagnoses and clinical severity tiers.
4. **Early Osteoarthritis Screening (SwasthSandhi)**: Digital WOMAC symptom screening with ML risk classification (AUC 0.96) for rural North Eastern Region camps.

```
┌─────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│   Multi-Source Ingest   │───▶│   AI & ML Ensemble Core  │───▶│   Actionable Dashboards  │
│ • IDSP Human Cases      │    │ • 54 Human HGB+XGB Models│    │ • Interactive Risk Maps  │
│ • MOSPI 37 Animal Dis.  │    │ • 111 National Ensembles │    │ • 2016-2026 Projections  │
│ • 9 District Vet Logs   │    │ • 44 Maharashtra Models  │    │ • Grounded AI Assistant  │
│ • NASA POWER Climate    │    │ • Symptom Triage & NLP   │    │ • IVR (1800-233-0418)    │
└─────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

---

## 🔬 Key Capabilities & Modules

### 1. 🗺️ EpiWatch — Human Disease Prediction
- **9 Tracked Districts**: Kolkata, Mumbai, Pune, Nagpur, Bengaluru Urban, Mysuru, Dharwad, Howrah, North 24 Parganas.
- **3 Major Diseases**: Dengue (`dengue`), Malaria (`malaria`), Acute Diarrhoeal Disease (`add`).
- **54 Trained Models**: Dual-tier pipeline (`HistGradientBoostingRegressor` baseline + `XGBoost` climate residual correction).
- **8-Week Holdout Backtesting**: Full auditable trajectory verification against `ml/results/backtest_results.json`.

### 2. 🐄 PashuRaksha — National & Maharashtra Livestock Surveillance
- **MOSPI / Dataful National Dataset (2005–2015)**:
  - 11 years of official Ministry of Statistics and Programme Implementation records across **37 livestock diseases**.
  - **111 Trained Ensemble Models** forecasting:
    * **Attacks (Cases / Infections)**
    * **Outbreaks (Cluster Events)**
    * **Deaths (Mortality & Case Fatality Rates)**
  - **2016–2026 Multi-Horizon Projections** with uncertainty intervals.
- **Maharashtra District Surveillance (9 Priority Districts)**:
  - Pune, Ahmednagar, Nashik, Kolhapur, Sangli, Solapur, Nagpur, Latur, Jalgaon.
  - 5 Priority Diseases: Foot-and-Mouth Disease (FMD), Lumpy Skin Disease (LSD), PPR, Brucellosis, Avian Influenza (H5N1).
  - **44 District Models** cross-calibrated with national historical priors.
  - 10 operational pillars including 5-stage lab sample tracking, INAPH-aligned vaccination histories, DTMF-IVR helpline (`1800-233-0418`), and trilingual support (EN / MR / HI).
  - 📖 **[Read Full PashuRaksha Documentation (README_PASHURAKSHA.md)](README_PASHURAKSHA.md)**

### 3. 🩺 Clinical Symptom Triage Engine
- Ingests 517 symptom-disease records mapping clinical presentations to 649 potential diagnoses.
- Combines TF-IDF vectorization with `OneVsRestClassifier` (Random Forest) and Gradient Boosting for real-time symptom-to-disease probability scoring and severity grading (Mild, Moderate, Severe).

### 4. 🦵 SwasthSandhi — OA Early-Detection Screening (SIH26004)
- Digital screening workflow assessing WOMAC joint symptoms with machine learning risk scoring (AUC 0.96) and rural referral pathways for the North Eastern Region.

### 5. 🤖 Grounded Conversational AI Assistant
- Conversational assistant grounded in real database records, SHAP feature attributions, and Census provenance chunks to eliminate hallucinations.

---

## 🏛️ System Architecture

```
epiwatch/
├── backend/                         # FastAPI REST API (Python 3.12)
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint
│   │   ├── config.py                # Environment configuration
│   │   ├── db.py                    # Resilient SQLAlchemy engine (PostgreSQL + SQLite fallback)
│   │   ├── models.py                # Human & core ORM models
│   │   ├── models_livestock.py      # PashuRaksha livestock ORM models
│   │   ├── schemas.py               # Pydantic validation schemas
│   │   ├── schemas_livestock.py     # Livestock Pydantic schemas
│   │   └── routers/
│   │       ├── districts.py         # GET /districts
│   │       ├── predictions.py       # GET /districts/{id}/forecast, /history
│   │       ├── backtest.py          # GET /backtest/{event_id}
│   │       ├── methodology.py       # GET /methodology
│   │       ├── assistant.py         # POST /assistant/query (Grounded AI)
│   │       ├── livestock_dataful.py # GET /livestock/dataful/summary, /diseases, /trends, /metrics, /triage
│   │       ├── livestock_reports.py # POST /livestock/reports
│   │       ├── livestock_dashboard.py # GET /livestock/dashboard/summary
│   │       ├── livestock_geo.py     # GET /livestock/geo/geojson
│   │       └── oa.py                # /oa/screening, /risk-summary
│   └── scripts/
│       ├── seed_all_datasets.py     # Master database initialization & seeding script
│       ├── test_dataful_endpoints.py # Automated test suite for Dataful & Triage APIs
│       └── e2e_test_suite.py        # Integration test runner
│
├── frontend/                        # Next.js 15 Web Application (TypeScript)
│   ├── app/
│   │   ├── page.tsx                 # Human epidemiology dashboard & risk map
│   │   ├── district/[id]/           # District drilldown & forecasts
│   │   ├── proof/                   # Backtest proof & historical validation
│   │   ├── methodology/             # ML model transparency & feature attributions
│   │   ├── livestock/               # PashuRaksha Animal-Health Surveillance PWA
│   │   │   ├── map/                 # Interactive livestock disease GIS map
│   │   │   ├── dashboard/           # Official veterinary officer KPI dashboard
│   │   │   ├── report/              # Mobile/Web symptom & mortality reporting form
│   │   │   ├── records/             # Digital animal health & vaccination registry
│   │   │   └── lab/                 # 5-stage diagnostic lab referral tracking
│   │   └── oa/                      # SwasthSandhi OA screening module
│   └── lib/                         # API clients & multilingual internationalization
│
├── ml/                              # Machine Learning Core
│   ├── livestock/
│   │   ├── train_dataful_models.py  # Trains 111 national models (37 diseases, 3 targets)
│   │   ├── train_livestock_models.py# Trains 44 Maharashtra district models
│   │   ├── models/dataful/          # 111 .pkl national model binaries
│   │   └── results/                 # dataful_model_metrics.json, dataful_forecasts_2016_2026.json
│   ├── models/                      # 54 human forecast models + symptom triage models
│   └── scripts/
│       ├── train_and_predict.py     # Human epidemiological pipeline
│       └── train_symptom_triage_model.py # NLP clinical triage classifier
│
├── data/
│   ├── data_manifest.json           # SHA-256 cryptographic provenance manifest
│   ├── raw/
│   │   ├── dataful/                 # MOSPI livestock incidence CSV + metadata
│   │   ├── healthcare/              # Clinical symptom-disease dataset
│   │   ├── livestock/               # District livestock master data
│   │   ├── idsp/                    # IDSP human surveillance records
│   │   └── climate/                 # NASA POWER JSON feeds
│   └── processed/
│       ├── dataful_livestock_annual.csv
│       ├── dataful_disease_summary.json
│       └── joined_weekly.csv
│
├── audit.py                         # Cryptographic audit runner
├── requirements.txt                 # Pinned dependencies
└── PITCH_TRACEABILITY_MATRIX.md     # Presentation claim verification matrix
```

---

## 📊 Database Schema & Record Volume

The platform supports both **Supabase PostgreSQL** and **Local SQLite** with zero-downtime fallback:

| Table | Domain / Source | Records | Key Fields |
| :--- | :--- | :--- | :--- |
| `districts` | Census 2011 Human Demographics | 9 | Population, density, coordinates, sanitation score |
| `diseases` | Epidemiological Classification | 3 | Name, transmission mode, IDSP code, primary drivers |
| `case_data` | IDSP Weekly Human Surveillance | 11,232 | District, disease, week start, cases, deaths |
| `climate_data` | NASA POWER Satellite Observations | 3,744 | Rainfall, max/min temp, relative humidity |
| `livestock_districts` | Maharashtra DAHD Census | 9 | Cattle, buffalo, goat, sheep, poultry, vet clinics |
| `dataful_livestock_annual` | MOSPI Official National Data (2005–15) | 407 | Outbreaks, attacks, deaths, CFR, attack ratios |
| `dataful_disease_summaries` | 37 Livestock Disease Profiles | 37 | 10-year trends, peak years, risk classification |
| `dataful_disease_forecasts` | ML Projections (2016–2026) | 1,221 | Annual predicted attacks, outbreaks, deaths, CI |
| `archive_symptom_disease_mapping` | Clinical Symptom Database | 517 | Symptoms, suspected diseases, severity, languages |

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & `npm`

### 1. Setup Backend
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r ../requirements.txt
```

### 2. Seed Database & Train Models
```bash
# Ingest and seed all datasets into database
python backend/scripts/seed_all_datasets.py

# Train MOSPI/Dataful national models (37 diseases)
python ml/livestock/train_dataful_models.py

# Train Maharashtra district livestock models (44 models)
python ml/livestock/train_livestock_models.py

# Train Clinical Symptom Triage NLP classifier
python ml/scripts/train_symptom_triage_model.py
```

### 3. Run FastAPI Backend
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: **http://localhost:8000/docs**

### 4. Run Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Dashboard will be live at: **http://localhost:3000**
- Human Epidemiology: `http://localhost:3000`
- PashuRaksha Livestock Surveillance: `http://localhost:3000/livestock`
- SwasthSandhi OA Screening: `http://localhost:3000/oa`

---

## 🧪 Verification & Automated Testing

Run the test suite:
```bash
# Run Dataful and Triage API tests
python backend/scripts/test_dataful_endpoints.py

# Run PashuRaksha Livestock test suite
python backend/scripts/test_livestock_endpoints.py

# Run session cryptographic audit
python audit.py
```

---

## 📜 License & Acknowledgements
- Built for the **Ministry of Statistics and Programme Implementation (MOSPI)**, **Department of Animal Husbandry, Dairying & Fisheries (DAHD)**, and **Integrated Disease Surveillance Programme (IDSP)**.
- Released under the **MIT License**.
