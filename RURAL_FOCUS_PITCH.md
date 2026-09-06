# 🌾 EpiWatch GramRaksha + PashuRaksha — Rural Focus Pitch Guide

A competition-ready narrative guide demonstrating how the entire architecture is focused on **Rural Public Health, Smallholder Livestock Economies, and Grassroots One-Health Resilience**.

---

## 🎯 1. The 30-Second Elevator Pitch

> *"In rural India, disease outbreaks are economic catastrophes. Over 80% of livestock belongs to smallholders and marginal farmers, where an animal is a family's only bank account. At the same time, 75% of emerging infectious diseases originate at the rural farm-forest interface.*
> 
> *Traditional disease surveillance is urban-centric and reactive — detecting outbreaks only after hospital beds fill up or cattle herds die.*
> 
> *We built **EpiWatch GramRaksha + PashuRaksha**: an AI-powered Rural One-Health Outbreak Shield. By fusing 11 years of MOSPI livestock data, 19th Census records across **356 Maharashtra tehsils**, and NASA satellite climate telemetry, we forecast animal and human epidemics **4 to 8 weeks in advance**. We empower Gram Panchayats, Pashu Sakhis, and Primary Health Centres with instant AI symptom triage, multilingual alerts, and proactive Mobile Veterinary dispatch before the crisis peaks."*

---

## 🏛️ 2. The 4 Pillars of Rural Impact

```
                    ┌─────────────────────────────────────────────────────────┐
                    │       RURAL ONE HEALTH EPIDEMIC RESILIENCE CORE         │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
          ┌──────────────────────┬───────────────┴───────────────┬──────────────────────┐
          ▼                      ▼                               ▼                      ▼
┌──────────────────┐   ┌──────────────────┐            ┌──────────────────┐   ┌──────────────────┐
│  PASHURAKSHA     │   │  MONSOON VECTOR  │            │  PASHU SAKHI     │   │  SWASTHSANDHI    │
│  LIVESTOCK BANK  │   │  & WATER DEFENSE │            │  GRASSROOTS APP  │   │  FARMER CARE     │
│ • 356 MH Tehsils │   │ • Acute Diarrhea │            │ • Vernacular IVR │   │ • WOMAC Joint    │
│ • 32.48M Animals │   │ • Forest Malaria │            │ • NLP AI Triage  │   │   Screening      │
│ • 37 Dis. Models │   │ • Climate Lags   │            │ • 5-Stage Labs   │   │ • AUC 0.96 Model │
└──────────────────┘   └──────────────────┘            └──────────────────┘   └──────────────────┘
```

---

### Pillar 1: Protecting the Smallholder Livestock Economy (PashuRaksha)
* **The Reality**: In rural households, dairy cows, bullocks, goats, and backyard poultry are the only liquid savings. An outbreak of Foot-and-Mouth Disease (FMD), Lumpy Skin Disease (LSD), or Peste des Petits Ruminants (PPR) plunges a family into intergenerational debt.
* **Our Solution**:
  * Ingested official 11-year MOSPI dataset across **37 livestock diseases**.
  * Trained **111 National Ensemble ML models** forecasting Attacks, Outbreaks, and Mortality up to 2026.
  * Mapped **32.48 Million livestock and 77.79 Million poultry birds** across all **356 tehsils and 34 districts of Maharashtra**.
  * Dynamic **Mobile Veterinary Unit (MVU)** routing to high-vulnerability talukas before seasonal outbreaks hit.

### Pillar 2: Rural Human Health & Monsoon Epidemic Early Warning
* **The Reality**: During monsoon flooding, rural drinking wells and open drainage cause massive spikes in **Acute Diarrheal Disease (ADD)** and infant dehydration. Forest-fringe tribal tehsils face severe **Malaria** surges.
* **Our Solution**:
  * Ingests weekly **NASA POWER satellite weather telemetry** (rainfall spikes, temperature, humidity lags).
  * Dual-tier ML models (`HistGradientBoosting` + `XGBoost`) predict case spikes **4 to 8 weeks ahead**, allowing PHCs to pre-stock ORS, IV fluids, antimalarials, and vector fogging supplies.

### Pillar 3: Empowering Grassroots Frontline Workers (Pashu Sakhis & ASHA)
* **The Reality**: Rural villages lack diagnostic pathology laboratories. Farmers have to travel 30–50 km to district headquarters for blood/tissue sample reports.
* **Our Solution**:
  * **Pashu Sakhi / Field Worker App**: Instant NLP clinical symptom triage trained on 517 clinical presentations.
  * **Vernacular Audio/IVR Helpline** (`1800-233-0418`): Farmers and field workers can report in Marathi, Hindi, or English.
  * **5-Stage Diagnostic Lab Pipeline**: Samples collected in the village are cold-chain tracked through district diagnostic labs.

### Pillar 4: Agricultural Laborer Musculoskeletal Screening (SwasthSandhi)
* **The Reality**: Millions of rural agricultural workers suffer from severe Knee Osteoarthritis due to lifelong bending, transplanting, and load-carrying in fields, with zero orthopedic screening available.
* **Our Solution**:
  * Digital WOMAC functional screening with Gradient-Boosted ML risk scoring (AUC 0.96) for rural health camps.

---

## 📊 3. How to Answer Common Judge Questions

| Question | Winning Rural-Focused Answer |
| :--- | :--- |
| **"How does this help a remote farmer?"** | *"A farmer doesn't need to read data charts. If their cow develops mouth blisters, they or the village Pashu Sakhi use our voice intake. Our NLP triage instantly flags suspected FMD, notifies the taluka vet, and triggers SMS advisories in Marathi to nearby farms to quarantine herds."* |
| **"Why is your dataset granular enough for rural areas?"** | *"Unlike state-level dashboards, we ingested the official 19th Livestock Census covering all 356 tehsils across all 34 Maharashtra districts. We know exact block-by-block populations of indigenous cattle, crossbreds, buffaloes, sheep, goats, and backyard poultry."* |
| **"How is this different from existing government IDSP/INAPH portals?"** | *"IDSP and INAPH are backward-looking accounting tools — they record cases after the damage is done. We are a **proactive 4-to-8-week forward forecasting engine** powered by satellite climate lags and 111 ML ensembles, giving chief veterinary and medical officers the lead time to act."* |
