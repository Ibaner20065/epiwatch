const API_BASE = process.env.NEXT_API_URL || "https://epiwatch-xrhv.onrender.com";

export interface District {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  population: number;
}

export interface ForecastPoint {
  id?: number;
  district_id: string;
  disease: string;
  week_start: string;
  predicted_cases: number;
  ci_lower: number;
  ci_upper: number;
  risk_tier: "Low" | "Medium" | "High" | "Critical";
  model_version: string;
}

export interface HistoricalPoint {
  week_start: string;
  cases: number;
  deaths: number;
  rainfall_mm?: number;
  temp_max_c?: number;
  humidity_pct?: number;
}

export interface RiskResponse {
  district_id: string;
  district_name: string;
  risks?: { disease: string; risk_tier: string }[];
  risk_by_disease?: Record<string, string>;
}

export interface BacktestEvent {
  id: number;
  district_id: string;
  disease: string;
  event_name: string;
  actual_peak_week: string;
  predicted_lead_weeks: number;
  metrics_json: {
    mae: number;
    rmse: number;
    weeks: string[];
    actual: number[];
    predicted: number[];
    cutoff_date?: string;
    predicted_peak_week?: string;
    lead_time_weeks?: number;
  };
}

export async function fetchDistricts(): Promise<District[]> {
  try {
    const res = await fetch(`${API_BASE}/districts`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend API unreachable, using static fallback for districts:", e);
  }
  const fallback = await fetch("/data/districts.json");
  return fallback.json();
}

export async function fetchForecast(districtId: string, disease: string = "dengue"): Promise<ForecastPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/districts/${districtId}/forecast?disease=${disease}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Backend API unreachable, using static fallback for ${districtId} forecast:`, e);
  }
  
  const fallback = await fetch("/data/predictions.json");
  const all: ForecastPoint[] = await fallback.json();
  return all.filter((p) => p.district_id.toUpperCase() === districtId.toUpperCase())
            .filter((p) => p.disease.toLowerCase() === disease.toLowerCase());
}

export async function fetchHistory(districtId: string, disease: string = "dengue"): Promise<HistoricalPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/districts/${districtId}/history?disease=${disease}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.series || [];
    }
  } catch (e) {
    console.warn(`Backend API unreachable for history:`, e);
  }
  return [];
}

export async function fetchRisk(districtId: string): Promise<RiskResponse> {
  try {
    const res = await fetch(`${API_BASE}/districts/${districtId}/risk`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Backend API unreachable for risk:`, e);
  }
  return { district_id: districtId, district_name: districtId, risk_by_disease: { dengue: "Low", malaria: "Low", add: "Low" } };
}

export async function fetchBacktest(districtId: string = "PUNE", disease: string = "dengue"): Promise<BacktestEvent | null> {
  try {
    const res = await fetch(`${API_BASE}/backtest?district_id=${districtId}&disease=${disease}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend API unreachable, using static fallback for backtest:", e);
  }

  try {
    const fallback = await fetch("/data/backtest.json");
    const data = await fallback.json();
    const arr = Array.isArray(data) ? data : [data];
    return arr.find((b) => b.district_id.toLowerCase() === districtId.toLowerCase() && b.disease.toLowerCase() === disease.toLowerCase()) || null;
  } catch (e) {
    return null;
  }
}

export async function fetchMethodology(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/methodology`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend API unreachable, using static fallback for methodology:", e);
  }
  const fallback = await fetch("/data/methodology.json");
  return fallback.json();
}

export interface ShapFeature {
  feature: string;
  label: string;
  importance: number;
  percentage: number;
}

export interface ShapResponse {
  district_id: string;
  disease: string;
  features: ShapFeature[];
}

export async function fetchShapFeatures(districtId: string, disease: string = "dengue"): Promise<ShapResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/districts/${districtId}/shap?disease=${disease}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Backend API unreachable for SHAP features:`, e);
  }
  return null;
}

export interface RegionalSignal {
  type: string;
  title: string;
  summary: string;
  relevance: string;
  source: string;
  districts_mentioned: string[];
}

export interface RegionalSignalResponse {
  district_id: string;
  district_name: string;
  state: string;
  signals: RegionalSignal[];
  signal_count: number;
  disclaimer: string;
}

export async function fetchRegionalSignals(districtId: string): Promise<RegionalSignalResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/news/regional-signal?district_id=${districtId}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Backend API unreachable for regional signals:`, e);
  }
  return null;
}

export interface Precaution {
  disease_id: string;
  individual_precautions?: string[];
  community_precautions?: string[];
  early_warning_symptoms?: string[];
  high_risk_groups?: string[];
  govt_helpline?: string;
  seasonal_window?: string;
}

export interface GovtScheme {
  disease_id: string;
  scheme_name: string;
  covering_body: string;
  max_coverage_amount?: string;
  eligibility_summary?: string;
  application_link?: string;
  helpline?: string;
}

export async function fetchPrecautions(diseaseId: string): Promise<Precaution | null> {
  try {
    const res = await fetch(`${API_BASE}/precautions/${diseaseId}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Backend API unreachable for precautions:`, e);
  }
  return null;
}

export async function fetchGovtBenefits(diseaseId: string): Promise<GovtScheme[]> {
  try {
    const res = await fetch(`${API_BASE}/benefits/${diseaseId}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Backend API unreachable for benefits:`, e);
  }
  return [];
}
