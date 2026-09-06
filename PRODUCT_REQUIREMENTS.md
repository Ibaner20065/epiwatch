# EpiWatch GramRaksha + PashuRaksha
## Product Requirements Document

**Status:** Proposed product baseline  
**Version:** 1.0  
**Date:** 2026-09-06  
**Product owner:** EpiWatch team  
**Primary geography:** Maharashtra, India  

## 1. Product summary

EpiWatch GramRaksha + PashuRaksha is a rural One-Health decision-support platform for
detecting, explaining, and coordinating responses to human and livestock disease risk.
It combines epidemiological surveillance, livestock census and disease data, climate
signals, community reports, and model backtesting in one interface for public-health,
veterinary, and grassroots users.

The product is not a diagnostic or treatment system. It provides risk intelligence,
triage support, and workflow coordination so qualified officials and field workers can
act earlier and with better local context.

## 2. Problem statement

Rural communities face linked human, animal, climate, and livelihood risks:

- Human outbreak signals can be missed until cases reach health facilities.
- Livestock outbreaks can cause immediate household income and food-security losses.
- Climate and monsoon conditions change risk faster than static plans can reflect.
- PHCs, veterinary teams, Gram Panchayats, ASHA workers, and Pashu Sakhis need
  location-specific information in a form usable in the field.
- Forecasts require transparent historical validation before officials can trust them.

## 3. Goals and success criteria

### Goals

1. Provide district- and tehsil-level early warning for priority human and livestock
   disease risks.
2. Turn predictions into clear, prioritized actions for public-health and veterinary
   teams.
3. Make community reporting and field triage fast enough for mobile use.
4. Show model provenance, assumptions, uncertainty, and historical performance.
5. Protect farmer livelihoods by connecting animal surveillance with alerts, records,
   laboratory workflows, and response coordination.

### Initial success criteria

- Users can identify high-risk locations and diseases from the dashboard without
  specialist ML knowledge.
- Forecast views show a usable lead-time estimate, risk tier, drivers, and recommended
  precautions.
- A field worker can submit a symptom or mortality report with location, species or
  disease context, severity, and reporter details.
- Officials can review active alerts, inspect trends, and follow a report through
  escalation and laboratory referral.
- Every public forecast has an accessible methodology and backtest view.
- The system remains useful when the configured database is temporarily unavailable by
  exposing clearly labeled fallback data where supported.

## 4. Users and user needs

| User | Needs | Primary surfaces |
| --- | --- | --- |
| District public-health officer | Compare districts, review human outbreak risk, plan interventions | EpiWatch dashboard, district detail, alerts |
| Veterinary officer / livestock department | Monitor animal disease risk, prioritize tehsils, coordinate response | PashuRaksha map, dashboard, alerts, lab |
| ASHA worker / Pashu Sakhi / Gram Sevak | Submit observations quickly, receive understandable triage guidance | Field report, symptom triage, multilingual/voice intake |
| PHC or veterinary laboratory coordinator | Track samples, referrals, results, and pending actions | Lab workflow |
| Gram Panchayat or community coordinator | Understand local risk and share precautions | Alerts, precaution guidance, assistant |
| Smallholder farmer | Report animal illness, understand urgent next steps, protect livelihood | Mobile reporting, animal records, alerts |
| Program evaluator / data scientist | Verify model quality and data provenance | Proof/backtest, methodology, data metrics |

## 5. Product scope

### In scope for the baseline release

#### 5.1 Human outbreak intelligence

- Monitor priority diseases including dengue, malaria, and acute diarrheal disease.
- Display district risk tiers, current signals, historical trends, and forecasts.
- Combine epidemiological history with climate and contextual features.
- Support district drilldowns and map-based exploration.
- Provide precautions and public-health action guidance linked to risk.

#### 5.2 Livestock surveillance and livelihood protection

- Cover Maharashtra districts and tehsils represented by the available livestock data.
- Track priority livestock diseases, species, attacks, outbreaks, deaths, and trends.
- Display livestock risk maps and official veterinary KPIs.
- Support disease, symptom, and mortality reporting.
- Maintain animal records including vaccination and treatment history.
- Track laboratory referrals through status and result stages.
- Surface active alerts with severity, location, status, and escalation context.

#### 5.3 Field intake and triage

- Accept structured reports from community and frontline workers.
- Capture reporter, location, date, species or human-health context, symptoms,
  mortality, severity, and free-text notes where applicable.
- Return suspected categories and confidence or severity indicators as decision
  support, not as a confirmed diagnosis.
- Design workflows for low-bandwidth mobile use and future Marathi/Hindi voice or IVR.

#### 5.4 Explainability and proof

- Explain forecast drivers in plain language.
- Expose model methodology, training cutoff, data sources, and limitations.
- Provide historical backtests showing predicted versus actual curves.
- Report lead time, peak timing, MAE, RMSE, and other available evaluation metrics.
- Preserve data provenance and distinguish observed, predicted, and inferred values.

#### 5.5 Grounded assistant

- Answer operational questions using approved epidemiology documents and platform
  data.
- Link answers to relevant locations, diseases, alerts, or precautions when possible.
- Refuse unsupported medical claims and direct users to qualified professionals for
  diagnosis or treatment.

#### 5.6 Farmer OA screening

- Provide a digital WOMAC-style screening flow for occupational joint pain and
  stiffness.
- Return a screening risk summary and appropriate next-step guidance.
- Clearly label screening as non-diagnostic.

### Out of scope for the baseline release

- Autonomous diagnosis, prescription, or treatment decisions.
- Automatic public alerts without human review and configurable escalation rules.
- Replacing official IDSP, veterinary, laboratory, or emergency-response systems.
- Guaranteed forecast accuracy or universal coverage outside supported geographies.
- Financial, insurance, or compensation adjudication.
- Collection of personally identifiable information beyond what a workflow requires.

## 6. Functional requirements

### FR-1: Location and disease selection

The platform shall allow users to select a supported district, tehsil, disease, and
time range. Selection state shall be reflected in URLs where practical so views can be
shared and revisited.

### FR-2: Risk overview

The dashboard shall show:

- current risk tier and count of high or critical locations;
- latest observation and forecast horizon;
- map or ranked list of affected locations;
- key contributing signals;
- timestamp and freshness of the underlying data.

### FR-3: Forecast detail

For a selected location and disease, the system shall show historical observations,
future forecast values, uncertainty or confidence information when available, risk
tier, anticipated peak, and recommended actions.

### FR-4: Alert lifecycle

Authorized users shall be able to view alerts by status and severity, inspect the
source evidence, assign or acknowledge an alert, record escalation, and resolve it
with an audit trail.

### FR-5: Community report submission

A reporter shall be able to submit a report from a mobile-friendly form. Required
fields shall be validated before submission, and the system shall return a durable
report identifier and status.

### FR-6: Triage safety

Triage output shall use explicit labels such as “suspected,” “screening,” or
“decision support.” It shall not present a model result as a confirmed diagnosis and
shall include escalation guidance for severe or emergency conditions.

### FR-7: Animal and vaccination records

Authorized veterinary users shall be able to search animal or herd records, view
vaccination and treatment history, and append new events with actor and timestamp.

### FR-8: Laboratory workflow

Users shall be able to create and update a referral, track sample status, associate
results with a report or animal, and see overdue or pending actions.

### FR-9: Backtest and methodology

Every supported forecast family shall have a methodology view describing sources,
features, training approach, cutoff rules, known limitations, and evaluation metrics.
Backtest views shall make the comparison period and normalization explicit.

### FR-10: Assistant grounding

Assistant responses shall be grounded in approved sources and current platform data.
The response shall disclose when information is unavailable, stale, uncertain, or
outside the assistant’s supported scope.

### FR-11: Accessibility and language

Core workflows shall be usable on a small mobile viewport, with keyboard-accessible
controls, readable contrast, clear loading and error states, and progressive support
for English, Marathi, and Hindi.

## 7. Data and ML requirements

- Use versioned, attributable sources such as IDSP surveillance, official livestock
  census data, MOSPI disease records, and NASA POWER climate data.
- Store source metadata, ingestion timestamp, coverage period, and quality status.
- Validate schema, date ranges, geography identifiers, and missingness during ingestion.
- Separate observed records from predictions and user-submitted reports.
- Prevent future data leakage in backtests by honoring a documented training cutoff.
- Record model version, feature set, training period, forecast generation time, and
  evaluation results.
- Surface uncertainty and data-quality limitations rather than silently substituting
  values.
- Support retraining and recalculation without changing historical results in place;
  preserve prior model runs for comparison.

## 8. Non-functional requirements

### Reliability

- Health checks shall expose API and database status.
- Core read-only dashboards shall present a clear degraded-mode state when a dependency
  is unavailable.
- Report submission shall not claim success unless the server has persisted or
  explicitly queued the report.

### Performance

- Dashboard initial content should render within 3 seconds on a normal broadband
  connection and remain usable on constrained mobile networks.
- Standard read APIs should target p95 latency below 1 second under expected pilot load.
- Map and chart interactions should not require a full-page reload.

### Security and privacy

- Enforce role-based access for operational actions and personally identifiable data.
- Encrypt traffic in transit and protect secrets through environment configuration.
- Collect the minimum reporter and patient/owner information necessary for care
  coordination.
- Log access and mutations to alerts, reports, records, laboratory data, and model
  runs.
- Apply retention and deletion rules appropriate to health and agricultural records.

### Observability

- Capture API errors, report failures, stale data, model generation failures, and
  alert-delivery failures with correlation identifiers.
- Provide operational metrics for ingestion freshness, endpoint health, queue depth,
  and unresolved alerts.

## 9. Key workflows

### Workflow A: Human outbreak monitoring

1. Officer opens the dashboard and selects a district and disease.
2. System displays current risk, forecast horizon, map context, and recent observations.
3. Officer opens the forecast detail to review drivers, uncertainty, and precautions.
4. Officer opens the proof view to inspect historical lead time and error metrics.
5. Officer acknowledges or escalates an alert through the approved operational process.

### Workflow B: Livestock field report

1. Pashu Sakhi selects location, species, and report type.
2. Worker records symptoms, onset, affected animals, mortality, and severity.
3. System validates the report and returns a report ID plus triage guidance.
4. Veterinary staff review the report, create or update an alert, and assign follow-up.
5. If testing is needed, staff create a laboratory referral and track its result.

### Workflow C: Farmer screening

1. Worker or farmer completes the WOMAC screening questionnaire.
2. System calculates a screening summary.
3. The result explains that it is not a diagnosis and recommends an appropriate
   professional follow-up based on severity.

## 10. Success metrics

### Adoption and usability

- Weekly active users by role and geography.
- Completion rate and median time for field reports.
- Percentage of users who reach a forecast detail from the overview.
- Task success rate in mobile usability tests.

### Operational impact

- Median time from report submission to first review.
- Median time from alert creation to acknowledgement and escalation.
- Percentage of laboratory referrals with a recorded status update.
- Percentage of high-risk alerts with documented action.

### Model and data quality

- Forecast MAE/RMSE by disease, geography, and horizon.
- Lead-time distribution and peak-timing error.
- Calibration of risk tiers and false-alert rate.
- Data freshness, missingness, validation failures, and ingestion success rate.

### Safety and trust

- Rate of assistant answers with source grounding.
- Triage escalation recall for severe reports.
- Number of confirmed incidents of diagnostic overclaiming or unsafe guidance.
- User-reported confidence in forecast explanations and recommended actions.

## 11. Release plan

### Phase 1: Pilot-ready intelligence

- Human dashboard, district detail, forecast charts, risk tiers, precautions.
- Livestock overview, map, dashboard, active alerts, and structured reporting.
- Methodology and backtest proof for supported human forecasts.
- Health checks, error states, data freshness, and role-aware access foundations.

### Phase 2: Operational coordination

- Alert acknowledgement, assignment, escalation, and audit history.
- Animal records, vaccination workflows, lab referral tracking, and overdue queues.
- Multilingual content and low-bandwidth optimizations.
- Notification integrations subject to government approval.

### Phase 3: Scale and learning

- Voice/IVR intake and offline-first field capture.
- More diseases, states, and geographies after data-quality validation.
- Model monitoring, scheduled retraining, drift detection, and champion/challenger
  evaluation.
- Cross-domain One-Health analytics linking human, livestock, climate, and response
  signals while preserving privacy.

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Sparse, delayed, or biased surveillance data | Show freshness and limitations; use quality checks; avoid false precision |
| Forecasts interpreted as diagnoses | Use safety labels, human review, escalation guidance, and training |
| Connectivity constraints in rural areas | Responsive low-bandwidth UI, retry/queue design, and future offline support |
| Sensitive health and farmer data exposure | Minimize collection, enforce roles, encrypt, audit, and define retention |
| Model drift or changing disease regimes | Monitor error and drift; preserve model versions; require revalidation |
| Alert fatigue | Severity thresholds, deduplication, acknowledgement state, and configurable routing |
| Unverified claims or assistant hallucinations | Ground responses in approved sources and return explicit uncertainty |

## 13. Acceptance checklist for a pilot

- [ ] A public-health officer can select a district and disease and understand the
  current risk in under two minutes.
- [ ] A veterinary officer can identify the highest-priority livestock locations and
  inspect active alerts.
- [ ] A field worker can submit a valid report from a mobile viewport with actionable
  confirmation.
- [ ] Severe or emergency reports visibly direct the user to qualified human support.
- [ ] A reviewer can trace a displayed forecast to its data period, model version,
  methodology, and backtest metrics.
- [ ] Data and API failures show an honest, recoverable state rather than fabricated
  success.
- [ ] Pilot users can complete core workflows with the supported language and
  accessibility expectations.
- [ ] Security, privacy, and operational ownership are approved before real-world
  personal or clinical data is enabled.

