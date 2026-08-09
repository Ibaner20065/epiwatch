const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

export async function fetchBacktest(eventId: number = 1): Promise<BacktestEvent> {
  try {
    const res = await fetch(`${API_BASE}/backtest/${eventId}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend API unreachable, using static fallback for backtest:", e);
  }
  const fallback = await fetch("/data/backtest.json");
  const data = await fallback.json();
  return Array.isArray(data) ? data[0] : data;
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
