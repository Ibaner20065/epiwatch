<p align="center">
  <img src="https://img.shields.io/badge/EpiWatch%20GramRaksha-Rural%20One%20Health%20AI-00d4aa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white" alt="EpiWatch" height="40"/>
</p>

<h1 align="center">EpiWatch GramRaksha + PashuRaksha (पशुरक्षा)</h1>
<h3 align="center">AI-Powered Rural One-Health Disease Intelligence &amp; Smallholder Livelihood Protection Platform</h3>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/fastapi-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/database-PostgreSQL%20%7C%20SQLite-3FCF8E?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/models-200%2B%20trained-ff6b6b?style=flat-square" />
  <img src="https://img.shields.io/badge/focus-Rural%20%26%20Grassroots-00d4aa?style=flat-square" />
  <img src="https://img.shields.io/badge/one--health-Human%20%2B%20Livestock-d4af37?style=flat-square" />
  <img src="https://img.shields.io/badge/coverage-356%20Tehsils%20(MH)-4fc3f7?style=flat-square" />
</p>

<p align="center">
  <strong>Purpose-built for Rural India, Gram Panchayats, and Smallholder Farming Communities</strong>: A unified One-Health intelligence platform bridging rural primary healthcare, 356-tehsil livestock disease defense, grassroots Pashu Sakhi reporting, and climate-driven monsoon outbreak forecasting.
</p>

---

## 🌾 The Rural Problem & Mission

In rural India, disease outbreaks are not just health crises — **they are economic catastrophes**:
1. **Livestock is the Farmer's Primary Bank Account**: Over 80% of India's livestock is reared by smallholders and landless farmers. A single outbreak of Foot-and-Mouth Disease (FMD), Lumpy Skin Disease (LSD), or Peste des Petits Ruminants (PPR) can decimate a family's livelihood and nutritional security.
2. **The Zoonotic & Monsoon Health Nexus**: 75% of emerging infectious diseases originate at the rural human-animal-forest interface. During monsoon inundations, rural communities face compound surges of waterborne Acute Diarrheal Disease (ADD) and vector-borne Malaria and Dengue.
3. **The Rural Diagnostic Desert**: Primary Health Centres (PHCs) and taluka veterinary dispensaries face 7–21 day delays for laboratory test confirmation.

**EpiWatch GramRaksha + PashuRaksha** delivers a proactive **Rural Outbreak Shield**:
* **4–8 Week Lead-Time Warning**: Ingests satellite climate telemetry (NASA POWER rainfall, temperature, humidity lags) to forecast outbreaks before hospital admissions or cattle mortalities spike.
* **Tehsil/Block-Level Granularity**: Grounded in official **19th Livestock Census figures across all 356 Maharashtra tehsils** (32.48M livestock, 77.79M poultry).
* **Grassroots Field Triage**: Instant AI NLP symptom triage for **Pashu Sakhis (community animal workers)** and ASHA workers, with vernacular Marathi/Hindi voice intake.
* **Farmer Musculoskeletal Care (SwasthSandhi)**: Early digital WOMAC screening for agricultural workers suffering from occupational joint disability (AUC 0.96).

```
┌──────────────────────────────────────┐    ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
│        RURAL DATA INGESTION          │───▶│       AI ENSEMBLE FORECASTING     │───▶│      GRASSROOTS ACTION HUBS       │
│ • IDSP Rural Disease Trends          │    │ • 111 National Livestock Ensembles│    │ • Gram Panchayat Multilingual SMS │
│ • MOSPI 37 Livestock Diseases        │    │ • 44 Maharashtra District Models  │    │ • Pashu Sakhi Field App + Audio   │
│ • 19th Census (356 MH Tehsils)       │    │ • 54 Human Vector/Water Models    │    │ • Mobile Vet Unit (MVU) Routing   │
│ • NASA POWER Monsoon Climate Lags    │    │ • NLP Clinical Symptom Classifier │    │ • 5-Stage Cold-Chain Lab Tracker  │
└──────────────────────────────────────┘    └───────────────────────────────────┘    └───────────────────────────────────┘
```

---

## 🔬 Core Rural Modules

### 1. 🐄 PashuRaksha — Rural Livestock Economy & Outbreak Surveillance
- **National MOSPI Foundation (2005–2015)**: 11 years of incidence across **37 livestock diseases** with **111 ensemble models** projecting Attacks, Outbreaks, and Deaths through 2026.
- **Maharashtra Tehsil & District Granularity (356 Tehsils across 34 Districts)**:
  - Official 19th Census breakdown of indigenous cattle, crossbreds, buffaloes, sheep, goats, and backyard poultry.
  - **44 District Models** cross-calibrated with national priors for priority diseases (FMD, LSD, PPR, Brucellosis, AI H5N1).
  - Mobile Veterinary Unit (MVU) route allocation based on tehsil vulnerability.

### 2. 🗺️ EpiWatch — Rural Human Health & Monsoon Epidemic Forecasting
- **Monsoon Waterborne & Vector Defense**: Forecasts spikes in Acute Diarrheal Disease (ADD / contaminated village water supplies), Malaria (rural forest-fringe blocks), and Dengue 4–8 weeks in advance.
- **Dual-Tier ML**: `HistGradientBoostingRegressor` baseline + `XGBoost` climate residual correction with SHAP weather explainability.

### 3. 📍 Pashu Sakhi & Village Worker Field Intake
- Grassroots reporting portal supporting **Pashu Sakhis, ASHA workers, and Gram Sevaks**.
- Real-time NLP symptom-to-disease inference with confidence scores and clinical severity grading (Mild, Moderate, Severe).
- Vernacular Marathi, Hindi, and English voice/IVR support (`1800-233-0418`).

### 4. 🦵 SwasthSandhi — Farmer Osteoarthritis Screening
- Community camp screening tool evaluating WOMAC pain and stiffness for rural agricultural laborers subjected to heavy field work.

### 5. 🤖 Grounded Village Health AI Assistant
- Decision support assistant grounded in verified epidemiology documents and Supabase database queries, refusing medical hallucinations.

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
