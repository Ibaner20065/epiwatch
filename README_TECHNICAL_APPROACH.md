# EpiWatch Technical Approach

## 1. Purpose

EpiWatch is a rural One-Health decision-support platform. It combines human
epidemiology, livestock surveillance, climate signals, field reports, and
farmer screening into one web application.

The technical approach is designed around four principles:

1. **Actionable geography** - forecasts and reports are returned at district,
   tehsil, or village-worker level rather than only at national scale.
2. **Explainable predictions** - model outputs are accompanied by risk tiers,
   historical context, backtests, and methodology metadata.
3. **Operational resilience** - the API can run against hosted PostgreSQL or a
   local SQLite database, which keeps the demo and field workflows usable when
   the remote database is unavailable.
4. **Human-in-the-loop safety** - triage and assistant features provide
   decision support, not autonomous diagnosis or treatment.

## 2. High-level architecture

```text
                         +-----------------------------+
                         | Next.js / React frontend    |
                         | Maps, charts, field forms,  |
                         | dashboards, assistant UI    |
                         +-------------+---------------+
                                       |
                             JSON over REST / CORS
                                       |
                         +-------------v---------------+
                         | FastAPI application          |
                         | Domain routers, validation,  |
                         | orchestration, health check |
                         +------+----------------------+
                                |
              +-----------------+------------------+
              |                                    |
   +----------v-----------+             +----------v-----------+
   | SQLAlchemy data layer |             | ML artifacts/results |
   | PostgreSQL or SQLite  |             | forecasts, triage,  |
   | human + livestock     |             | backtests, SHAP data |
   +-----------------------+             +----------------------+
                                ^
                                |
                 Offline data preparation and training
     IDSP + climate + census + livestock + clinical datasets
```

The main runtime entrypoint is
[`backend/app/main.py`](C:/Users/INDRAYUDH/epiwatch/backend/app/main.py).
It creates the FastAPI application, configures CORS, initializes ORM metadata,
and registers the human-health, livestock, assistant, and osteoarthritis
routers.

## 3. Data and provenance

### Source domains

- **Human surveillance:** IDSP case records for district-level disease trends.
- **Climate:** NASA POWER-derived rainfall, temperature, and humidity
  observations and lagged features.
- **Livestock:** MOSPI disease-incidence history, Maharashtra livestock census
  data, animal registries, and livestock master data.
- **Clinical triage:** symptom-to-disease training data used by the field
  intake workflow.
- **Geography:** district and tehsil crosswalks plus GeoJSON used by the map
  views.

Raw files are kept under [`data/raw/`](C:/Users/INDRAYUDH/epiwatch/data/raw/).
Processing scripts create normalized datasets in
[`data/processed/`](C:/Users/INDRAYUDH/epiwatch/data/processed/). The
[`data/data_manifest.json`](C:/Users/INDRAYUDH/epiwatch/data/data_manifest.json)
records file-level provenance and hashes so generated results can be audited.

### Preparation flow

1. Load source files and normalize dates, disease names, geography identifiers,
   and missing values.
2. Join surveillance observations to climate and geographic dimensions.
3. Aggregate observations to the model grain (weekly human surveillance or
   annual livestock incidence).
4. Persist processed datasets and seed application tables.
5. Train models offline and store metrics, forecasts, and explainability
   outputs under [`ml/results/`](C:/Users/INDRAYUDH/epiwatch/ml/results/) and
   the livestock result directories.

## 4. Forecasting approach

### Human disease forecasts

Human forecasts use a two-stage approach:

1. A `HistGradientBoostingRegressor` models the baseline disease signal from
   historical observations and calendar features.
2. An `XGBoost` residual model learns the remaining climate-related error using
   rainfall, temperature, humidity, and lag features.

The API converts predicted values into consistent risk tiers and returns the
forecast series with the drivers needed by the frontend. SHAP summaries are
stored and exposed through the methodology views to make weather influence
inspectable.

### Livestock forecasts

The livestock pipeline trains models from national MOSPI history and
Maharashtra-specific livestock data. Outputs cover disease targets such as
attacks, outbreaks, and deaths. The generated results include projections,
confidence information, training summaries, and model metrics. National and
district-level artifacts are kept separate so the application can combine
general disease priors with local livestock context.

### Symptom triage

Livestock field reports use a constrained triage workflow. Structured symptoms
are matched against disease indicators and, where available, the trained
symptom model. The response includes a suspected condition, confidence,
severity, and recommended escalation path. This is intentionally a screening
signal for a veterinary professional rather than a definitive diagnosis.

### Farmer osteoarthritis screening

The SwasthSandhi module accepts WOMAC-style pain and stiffness inputs and
returns a screening risk tier. Its model artifacts and thresholds are kept in
[`ml/oa/`](C:/Users/INDRAYUDH/epiwatch/ml/oa/), separate from outbreak
forecasting.

## 5. Backend design

The backend is a Python 3.12 FastAPI service. Pydantic schemas validate request
and response contracts, while SQLAlchemy models represent the human,
livestock, reporting, laboratory, and screening domains.

Important route groups include:

- Human geography, history, forecasts, and backtests.
- Methodology and model explanation.
- Grounded assistant queries.
- Livestock reports, records, alerts, laboratory tracking, dashboards, IVR,
  GeoJSON, and dataful summaries.
- Osteoarthritis screening and risk summaries.

Database configuration lives in
[`backend/app/config.py`](C:/Users/INDRAYUDH/epiwatch/backend/app/config.py).
The connection layer in
[`backend/app/db.py`](C:/Users/INDRAYUDH/epiwatch/backend/app/db.py) attempts
the configured PostgreSQL connection with pooling and a short connectivity
check. If that connection is unavailable, it uses the local
`backend/epiwatch.db` SQLite database. The `/health` endpoint reports the
active engine and connectivity result.

## 6. Frontend design

The frontend is a Next.js and React application written in TypeScript. The
home dashboard coordinates district and forecast requests, then renders:

- Interactive India and district risk maps.
- Disease forecast charts and risk badges.
- Alert and news signal panels.
- Backtest/proof and methodology views.
- Grounded assistant interaction.

The PashuRaksha routes provide livestock dashboards, maps, animal records,
field reporting, alerts, and lab tracking. The OA route provides the farmer
screening workflow. API access is centralized in
[`frontend/lib/`](C:/Users/INDRAYUDH/epiwatch/frontend/lib/), with
`NEXT_PUBLIC_API_URL` selecting the backend at runtime.

## 7. Reliability and safety controls

- **Startup tolerance:** ORM table creation failures do not prevent the API
  process from starting, allowing static/offline routes to remain available.
- **Database fallback:** local SQLite supports development and disconnected
  demonstrations.
- **Validation:** request and response schemas constrain API payloads.
- **Backtesting:** historical proof pages and stored backtest results expose
  forecast performance rather than presenting predictions without context.
- **Explainability:** methodology and SHAP outputs show important drivers.
- **Escalation:** triage results carry severity and are intended to route cases
  to veterinary, public-health, or clinical staff.
- **Configuration isolation:** secrets and deployment-specific URLs are read
  from environment variables; use `.env.example` files as templates.

## 8. Local development workflow

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API documentation is available at `http://localhost:8000/docs`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The dashboard is available at `http://localhost:3000`. Set
`NEXT_PUBLIC_API_URL` in `frontend/.env.local` when the API is not running on
the default local URL.

### Data and model rebuilds

The seed, processing, and training scripts are intentionally separate from
the web runtime. Run them when source data or model configuration changes,
then inspect the generated metrics and backtest artifacts before publishing
new forecasts.

## 9. Verification strategy

Verification is performed at three levels:

1. **Data audit:** validate source manifests, processed-file presence, and
   dataset summaries.
2. **Model validation:** inspect training metrics, forecast outputs, and
   historical backtest results.
3. **Application checks:** exercise API endpoint scripts, `/health`, frontend
   linting, and production builds.

Useful existing checks include:

```powershell
python backend/scripts/test_dataful_endpoints.py
python audit.py
cd frontend
npm run lint
npm run build
```

## 10. Scope and limitations

EpiWatch is a forecasting and prioritization system. It does not replace
laboratory confirmation, veterinary examination, public-health investigation,
or emergency response protocols. Forecast quality depends on the coverage,
timeliness, and geographic consistency of incoming surveillance and climate
data. Production deployments should add authentication, authorization,
observability, managed migrations, scheduled retraining, and formal review of
model drift and clinical safety.
