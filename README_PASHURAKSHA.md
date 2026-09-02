<p align="center">
  <img src="https://img.shields.io/badge/PashuRaksha-पशुरक्षा%20Animal%20Health%20Surveillance-d4af37?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white" alt="PashuRaksha" height="40"/>
</p>

<h1 align="center">PashuRaksha (पशुरक्षा)</h1>
<h3 align="center">Unified Animal-Health Surveillance & Decision-Support System for Maharashtra</h3>

<p align="center">
  <img src="https://img.shields.io/badge/State-Maharashtra%20Govt%20(DAHD)-FF9933?style=flat-square" />
  <img src="https://img.shields.io/badge/python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/fastapi-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/models-44%20trained-d4af37?style=flat-square" />
  <img src="https://img.shields.io/badge/tests-11%2F11%20pass-00d4aa?style=flat-square" />
  <img src="https://img.shields.io/badge/languages-EN%20%7C%20MR%20%7C%20HI-22d3ee?style=flat-square" />
  <img src="https://img.shields.io/badge/offline-resilient%20%2B%20IVR-green?style=flat-square" />
</p>

<p align="center">
  <strong>A real-time, multilingual, and offline-enabled disease surveillance, AI-assisted outbreak triage, and veterinary decision-support solution</strong> tailored for the <strong>Department of Animal Husbandry, Dairy Development & Fisheries, Government of Maharashtra</strong>.
</p>

---

## 📌 Problem Statement

Livestock owners, field veterinarians, para-veterinary workers, and government departments often lack a unified, real-time mechanism to identify emerging animal-health risks at the **village, block, and district levels**.
- **Late Disease Reporting**: Symptoms in herds are often reported after outbreaks have already spread beyond the index farm.
- **Distant Diagnostic Facilities**: Delayed sample referral to regional Disease Diagnostic Laboratories hinders timely pathogen confirmation.
- **Fragmented Records**: Vaccination and treatment histories remain siloed between farms, veterinary dispensaries, vaccination drives, and state surveillance programmes.
- **Rural Connectivity Constraints**: Lack of offline capability and telephony access limits field workers in low-connectivity belts.
- **Economic & Zoonotic Risks**: Gaps delay containment, increase livestock mortality and productivity loss, raise zoonotic transmission risks, and adversely impact farmers' livelihoods.

---

## 💡 Solution Overview & Core Outcomes

**PashuRaksha** delivers a unified surveillance workflow connecting **Farmers $\leftrightarrow$ Para-Vets $\leftrightarrow$ Field Veterinarians $\leftrightarrow$ Diagnostic Labs $\leftrightarrow$ District/State Officials (DVO/SVO)**:

```
┌────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│  Multi-Channel Ingest  │───▶│   AI & Rule Triage Core  │───▶│ Coordinated State Action │
│  • Mobile / Web PWA    │    │  • 5-Disease Rule Matrix │    │  • Geospatial Risk Maps  │
│  • Offline Local Queue │    │  • Outbreak Thresholds   │    │  • 5-Stage Lab Pipeline  │
│  • DTMF-IVR (1800...)  │    │  • HGB + XGBoost ML (44) │    │  • Trilingual Advisories │
└────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

### Key Expected Outcomes:
- ⏱️ **Reduced Reporting Time**: Near-instantaneous digital transmission with offline queue-and-sync.
- 🚨 **Earlier Outbreak Identification**: Rule-based + ML triage flagging clusters within minutes.
- 💉 **Improved Vaccination Coverage**: Complete animal health registry tracking NADCP vaccination rounds.
- 🧪 **Faster Treatment & Containment**: Integrated sample tracking from farm collection to lab result.
- 📉 **Lower Mortality & Economic Loss**: Pre-emptive containment rings and advisory broadcasts.
- 📊 **Evidence-Based Planning**: Real-time official dashboards and district comparison leaderboards.

---

## 🏛️ Target Geography — Maharashtra (9 Priority Districts)

Aligned with Maharashtra's livestock census density and veterinary infrastructure:

| District | Division | Cattle Population | Buffalo Population | Goat Population | Poultry Population | Key Infrastructure |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pune** | Pune | 412,000 | 298,000 | 185,000 | 2,100,000 | District Vet Hospital, 10 Dispensaries, DDL |
| **Ahmednagar** | Nashik | 685,000 | 520,000 | 310,000 | 890,000 | 12 Dispensaries, 6 Mobile Clinics, DDL |
| **Nashik** | Nashik | 498,000 | 380,000 | 270,000 | 1,500,000 | 11 Dispensaries, 4 Mobile Clinics |
| **Kolhapur** | Kolhapur | 520,000 | 445,000 | 195,000 | 3,200,000 | 9 Dispensaries, High Dairy Density, DDL |
| **Sangli** | Kolhapur | 390,000 | 310,000 | 260,000 | 980,000 | 8 Dispensaries, 3 Mobile Clinics |
| **Solapur** | Pune | 445,000 | 285,000 | 380,000 | 750,000 | 10 Dispensaries, High Small Ruminant Belt |
| **Nagpur** | Nagpur | 365,000 | 270,000 | 190,000 | 1,200,000 | Regional Disease Diagnostic Lab (RDDL) |
| **Latur** | Aurangabad | 410,000 | 340,000 | 290,000 | 620,000 | 8 Dispensaries, Marathwada Ruminant Hub |
| **Jalgaon** | Nashik | 470,000 | 350,000 | 240,000 | 950,000 | 10 Dispensaries, Northern Border Zone |

---

## 🦠 Priority Diseases & Species Coverage

| Disease Code | Disease Name | Target Species | Transmission Mode | Peak Season | Notification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fmd` | **Foot-and-Mouth Disease** | Cattle, Buffalo, Goat, Sheep | Direct contact / aerosol | Oct – Mar | ⚠️ Mandatory Notifiable |
| `lsd` | **Lumpy Skin Disease** | Cattle, Buffalo | Vector-borne (flies, ticks) | Jun – Oct (Monsoon) | ⚠️ Mandatory Notifiable |
| `ppr` | **Peste des Petits Ruminants** | Goat, Sheep | Direct contact / droplet | Nov – Mar | ⚠️ Mandatory Notifiable |
| `brucellosis`| **Brucellosis** | Cattle, Buffalo, Goat | Ingestion / reproductive fluids | Year-round | ⚠️ Zoonotic Alert |
| `ai_h5n1` | **Avian Influenza (H5N1)** | Poultry | Direct contact / wild birds | Dec – Mar | 🚨 Emergency Notifiable |

---

## 🌟 10 Capability Pillars

### 1. 📋 Mobile & Web Symptom / Mortality Reporting
- **Form UI**: [`/livestock/report`](file:///c:/Users/INDRAYUDH/epiwatch/frontend/app/livestock/report/page.tsx)
- Select from 25 standardized symptoms (*oral lesions, salivation, lameness, skin nodules, sudden death, milk drop, cyanosis*).
- Auto-captures reporter type (*Farmer, Para-Vet, Field Vet, Livestock Inspector, Panchayat Member*), GPS, and photos.
- **Offline Local Storage Queue**: Automatically saves reports when network is unavailable and batch syncs via `POST /livestock/reports/batch-sync` on reconnection.

### 2. 🧠 Clinical Rule & AI Triage Engine
- **Engine**: [`backend/app/livestock_triage.py`](file:///c:/Users/INDRAYUDH/epiwatch/backend/app/livestock_triage.py)
- Matches reported symptom arrays against disease signatures to generate diagnostic confidence percentages ($0.50$ to $0.99$).
- Checks outbreak thresholds:
  - $\ge 3$ village deaths within 7 days $\rightarrow$ **🟡 Warning Alert**
  - $\ge 5$ symptomatic animals with notifiable symptoms $\rightarrow$ **🔴 Outbreak Alert**
  - Mass die-off ($\ge 10$ large animals or $\ge 50$ poultry) $\rightarrow$ **⚫ Emergency Alert**

### 3. 🗺️ Geospatial Risk Mapping & Outbreak Clusters
- **Map UI**: [`/livestock/map`](file:///c:/Users/INDRAYUDH/epiwatch/frontend/app/livestock/map/page.tsx)
- **GeoJSON**: 9 Maharashtra district boundary polygons.
- Color-coded risk tiers (**Low 🟢, Medium 🟡, High 🟠, Critical 🔴**) with dynamic layer toggles for all 5 diseases.
- Spatial outbreak cluster visualization with epicenter radius.

### 4. 🐄 Animal & Herd-Level Digital Health Records
- **Registry UI**: [`/livestock/animals`](file:///c:/Users/INDRAYUDH/epiwatch/frontend/app/livestock/animals/page.tsx) & [`/livestock/animals/[id]`](file:///c:/Users/INDRAYUDH/epiwatch/frontend/app/livestock/animals/[id]/page.tsx)
- INAPH-compliant digital ear-tag records (`MH-PUN-XXXXXX`).
- Complete timeline tracking:
  - **Vaccinations**: Vaccine name, target disease, batch number, next due date, NADCP campaign.
  - **Treatments**: Diagnosis, observed symptoms, administered drugs, follow-up dates.
  - **Vaccination Coverage**: Real-time district coverage vs. national $80\%$ target.

### 5. 🚨 Real-Time Alerts & Official Escalation
- **Alerts UI**: [`/livestock/alerts`](file:///c:/Users/INDRAYUDH/epiwatch/frontend/app/livestock/alerts/page.tsx)
- Severity-filtered feed with single-click official acknowledgement and resolution tracking.
- SLA-based escalation queue for unresolved high-severity alerts.

### 6. 🌐 Trilingual Localization (English • मराठी • हिन्दी)
- **i18n Core**: [`frontend/lib/livestock-i18n.ts`](file:///c:/Users/INDRAYUDH/epiwatch/frontend/lib/livestock-i18n.ts)
- Comprehensive translations across symptoms, diseases, severity badges, forms, and advisory templates in **English**, **Marathi (मराठी)**, and **Hindi (हिन्दी)**.

### 7. 🔬 Sample Collection & Lab Referral Pipeline
- **Lab UI**: [`/livestock/lab`](file:///c:/Users/INDRAYUDH/epiwatch/frontend/app/livestock/lab/page.tsx)
- 5-stage tracking pipeline: **Collected $\rightarrow$ In Transit $\rightarrow$ Received at Lab $\rightarrow$ Under Testing $\rightarrow$ Result Available**.
- Automated disease confirmation alerts on positive lab results for notifiable pathogens.

### 8. 📊 Official Veterinary Dashboard
- **Dashboard UI**: [`/livestock/dashboard`](file:///c:/Users/INDRAYUDH/epiwatch/frontend/app/livestock/dashboard/page.tsx)
- 6 Key Performance Indicators (KPIs): Weekly Reports, Active Alerts, Vaccination Coverage %, Mortality Rate, Pending Samples, Registered Animals.
- 12-week disease trend bar charts and district comparative leaderboard.

### 9. 📞 IVR Telephony Integration (Low-Connectivity Channel)
- **Router**: [`backend/app/routers/livestock_ivr.py`](file:///c:/Users/INDRAYUDH/epiwatch/backend/app/routers/livestock_ivr.py)
- **DTMF Ingestion**: Accepts numeric keypresses (species code + symptom codes) from basic feature phones.
- **TTS-Friendly Advisories**: Returns synthesized Marathi and Hindi voice prompts via the toll-free helpline **1800-233-0418**.

### 10. 🤖 Grounded AI Conversational Assistant
- **Assistant Integration**: [`backend/app/routers/assistant.py`](file:///c:/Users/INDRAYUDH/epiwatch/backend/app/routers/assistant.py)
- **Document Chunks**: [`livestock_document_chunks.json`](file:///c:/Users/INDRAYUDH/epiwatch/data/processed/livestock_document_chunks.json)
- Grounded Q&A with strict provenance citations for Maharashtra veterinary schemes, biosecurity protocols, and disease symptoms.

---

## 🔬 Machine Learning Forecasting Pipeline

The system trains machine learning ensemble models (HistGradientBoosting + XGBoost) using historical case patterns, seasonal lag features, and rolling averages:

- **Script**: [`ml/livestock/train_livestock_models.py`](file:///c:/Users/INDRAYUDH/epiwatch/ml/livestock/train_livestock_models.py)
- **Trained Models**: 44 model binaries saved in `ml/livestock/models/`
- **Evaluation**: 8-week holdout evaluation across all district-disease combinations.
- **Performance Metrics**:
  - **Average MAE**: $0.002$ cases
  - **Average RMSE**: $0.002$ cases
  - **Training Success Rate**: $100\%$ ($44/44$ successful, $0$ failures)
  - Detailed metrics saved in [`ml/livestock/results/model_metrics.json`](file:///c:/Users/INDRAYUDH/epiwatch/ml/livestock/results/model_metrics.json).

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/livestock/districts` | List all 9 Maharashtra livestock districts with census metadata |
| `POST` | `/livestock/reports/symptom` | Submit symptom report with auto-triage & alert generation |
| `POST` | `/livestock/reports/mortality` | Submit mortality event |
| `POST` | `/livestock/reports/batch-sync` | Batch-upload offline queued reports |
| `GET` | `/livestock/reports` | Query filtered symptom reports |
| `POST` | `/livestock/triage/evaluate` | Dry-run triage preview without database persistence |
| `GET` | `/livestock/alerts` | Query active alerts by district, severity, and status |
| `PUT` | `/livestock/alerts/{id}/acknowledge` | Acknowledge an alert (Veterinary Officer) |
| `POST` | `/livestock/animals` | Register a new animal (ear-tag, owner, breed) |
| `GET` | `/livestock/animals` | Search animal registry |
| `GET` | `/livestock/animals/{id}` | Full animal profile with vaccination & treatment history |
| `GET` | `/livestock/animals/vaccination-coverage` | District vaccination coverage statistics |
| `POST` | `/livestock/lab/samples` | Register a sample collection event |
| `GET` | `/livestock/lab/samples` | Query lab referral pipeline |
| `PUT` | `/livestock/lab/samples/{id}/result` | Record lab test result (positive/negative) |
| `GET` | `/livestock/lab/pipeline-stats` | 5-stage sample pipeline statistics |
| `GET` | `/livestock/dashboard/summary` | Aggregate dashboard KPIs for Maharashtra |
| `GET` | `/livestock/dashboard/trends` | 12-week case & death trends |
| `GET` | `/livestock/dashboard/leaderboard` | District comparative surveillance leaderboard |
| `GET` | `/livestock/geo/geojson` | Maharashtra livestock districts GeoJSON boundaries |
| `GET` | `/livestock/geo/risk-map` | Real-time district risk tiers for selected disease |
| `GET` | `/livestock/geo/clusters` | Spatial outbreak cluster coordinates |
| `POST` | `/livestock/ivr/report` | DTMF-based telephone reporting endpoint |
| `GET` | `/livestock/ivr/advisory` | TTS-friendly multilingual voice advisory (EN/MR/HI) |
| `POST` | `/assistant/query` | Grounded AI assistant with livestock knowledge routing |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4 | Responsive web app, mobile bottom nav, offline queue |
| **Backend** | FastAPI 0.115, SQLAlchemy 2.0, Pydantic 2 | High-performance async REST API with offline fallbacks |
| **Database** | PostgreSQL / Supabase with local CSV static fallbacks | 8 livestock tables + historical registry |
| **ML Engine** | scikit-learn (HistGradientBoosting), XGBoost | 44 district-disease ensemble models |
| **Localization** | Custom lightweight i18n engine | English, Marathi (`मराठी`), Hindi (`हिन्दी`) |
| **Geospatial** | GeoJSON, SVG mapping, coordinates clustering | District polygons and outbreak coordinates |
| **Telephony** | DTMF-code parsing + TTS text generation | Feature phone & IVR helpline compatibility |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.12+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS/Linux

pip install -r ../requirements.txt
```

### 3. Generate Data & Train Models
```bash
# Generate Maharashtra synthetic surveillance & animal registry data
python ../data/scripts/synthesize_livestock_data.py

# Train 44 livestock forecasting models
python ../ml/livestock/train_livestock_models.py
```

### 4. Run Backend & Frontend
```bash
# Terminal 1 — Backend (FastAPI on Port 8000)
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (Next.js on Port 3000)
cd frontend
npm install
npm run dev
```

- Open **[http://localhost:3000/livestock](http://localhost:3000/livestock)** for the PashuRaksha Portal.
- Open **[http://localhost:8000/docs](http://localhost:8000/docs)** for interactive OpenAPI Documentation.

---

## 🧪 Verification & Automated Testing

Run the full end-to-end integration test suite:

```bash
cd backend
.venv\Scripts\python scripts/test_livestock_endpoints.py
```

**Output:**
```
test_01_root_and_health .................... ok
test_02_livestock_districts ................ ok
test_03_triage_evaluation .................. ok
test_04_submit_symptom_report .............. ok
test_05_livestock_alerts ................... ok
test_06_animal_registry .................... ok
test_07_dashboard_summary_and_trends ....... ok
test_08_lab_pipeline ....................... ok
test_09_ivr_endpoints ...................... ok
test_10_geospatial_endpoints ............... ok
test_11_assistant_livestock_intent ......... ok

----------------------------------------------------------------------
Ran 11 tests in 12.571s — OK (11/11 PASS)
```

Build the production frontend bundle:
```bash
cd frontend
npm run build
```
**Output:** `✓ Compiled successfully in 1032ms (15/15 routes generated with 0 errors)`.

---

## 📂 Repository File Map

```
epiwatch/
├── README_PASHURAKSHA.md                   # This documentation file
├── data/
│   ├── raw/
│   │   ├── livestock/
│   │   │   ├── livestock_master.csv        # Weekly surveillance records (1,729 rows)
│   │   │   ├── animal_registry.csv         # Animal registry with vaccinations (5,044 rows)
│   │   │   └── district_livestock.json     # 9 Maharashtra districts metadata
│   │   └── geojson/
│   │       └── livestock_districts.geojson # 9 Maharashtra district boundary polygons
│   ├── processed/
│   │   └── livestock_document_chunks.json  # Provenance chunks for AI assistant
│   └── scripts/
│       └── synthesize_livestock_data.py    # Maharashtra data generator
├── ml/
│   └── livestock/
│       ├── train_livestock_models.py       # HGB + XGBoost training pipeline
│       ├── models/*.pkl                    # 44 trained ML model binaries
│       └── results/
│           ├── model_metrics.json          # MAE/RMSE per district-disease
│           └── training_summary.json       # Overall training summary
├── backend/
│   ├── app/
│   │   ├── main.py                         # FastAPI application entrypoint
│   │   ├── models_livestock.py             # SQLAlchemy ORM models (8 tables)
│   │   ├── schemas_livestock.py            # Pydantic request/response schemas
│   │   ├── livestock_triage.py             # Rule-based + AI triage engine
│   │   └── routers/
│   │       ├── livestock_reports.py        # Symptom, mortality & batch sync APIs
│   │       ├── livestock_records.py        # Animal registry & vaccination coverage APIs
│   │       ├── livestock_alerts.py         # Alert feed & acknowledgement APIs
│   │       ├── livestock_lab.py            # 5-stage sample tracking & lab referral APIs
│   │       ├── livestock_dashboard.py      # Official KPIs, trends & leaderboard APIs
│   │       ├── livestock_geo.py            # GeoJSON, risk mapping & clusters APIs
│   │       ├── livestock_ivr.py            # DTMF phone reporting & voice advisory APIs
│   │       └── assistant.py                # Grounded AI chat with livestock routing
│   └── scripts/
│       └── test_livestock_endpoints.py     # 11-test automated integration suite
└── frontend/
    ├── app/
    │   └── livestock/
    │       ├── layout.tsx                  # Sidebar nav, mobile bar & language selector
    │       ├── page.tsx                    # PashuRaksha landing dashboard
    │       ├── report/page.tsx             # Symptom reporting form with live triage
    │       ├── map/page.tsx                # Geospatial risk map & disease layer toggle
    │       ├── dashboard/page.tsx          # Official veterinary dashboard & charts
    │       ├── animals/page.tsx            # Digital animal registry search
    │       ├── animals/[id]/page.tsx       # Individual animal health & vaccination timeline
    │       ├── lab/page.tsx                # 5-stage sample tracking & lab referral
    │       └── alerts/page.tsx             # Real-time alert feed & acknowledgement
    ├── lib/
    │   ├── livestock-api.ts                # TypeScript API client with static fallback
    │   └── livestock-i18n.ts               # Trilingual localization (EN / MR / HI)
    └── public/data/
        └── livestock_static.json           # Offline static fallback database
```

---

<p align="center">
  <sub>Developed for the Department of Animal Husbandry, Dairy Development & Fisheries, Government of Maharashtra</sub><br/>
  <sub>PashuRaksha (पशुरक्षा) — Early Warning • Rapid Response • Livestock Protection</sub>
</p>
