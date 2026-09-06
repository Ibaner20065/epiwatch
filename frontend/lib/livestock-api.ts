/**
 * PashuRaksha — Livestock API Client
 * ===================================
 * API client for all livestock endpoints with static-fallback pattern.
 * Mirrors the existing api-client.ts pattern for offline resilience.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ── Types ────────────────────────────────────────────────────────

export interface LivestockDistrict {
  id: string;
  name: string;
  state: string;
  division?: string;
  lat: number;
  lon: number;
  cattle_population: number;
  buffalo_population: number;
  goat_population: number;
  sheep_population: number;
  poultry_population: number;
  total_livestock: number;
  taluka_vet_dispensaries: number;
  mobile_vet_clinics: number;
  disease_diagnostic_lab: boolean;
}

export interface SymptomReport {
  id: number;
  report_id: string;
  district_id: string;
  block: string;
  village: string;
  species: string;
  breed?: string;
  num_affected: number;
  num_dead: number;
  symptoms: string[];
  severity: string;
  suspected_disease?: string;
  description?: string;
  reporter_type: string;
  reporter_name?: string;
  reporter_phone?: string;
  lat?: number;
  lon?: number;
  reported_at: string;
  offline_synced: boolean;
  triage_result?: TriageResult;
  language: string;
}

export interface TriageResult {
  suspected_diseases: SuspectedDisease[];
  alert_recommended: boolean;
  alert_severity?: string;
  alert_reason?: string;
  triage_notes: string;
}

export interface SuspectedDisease {
  disease_id: string;
  name: string;
  confidence: number;
  notifiable: boolean;
  quarantine_days: number;
  matching_symptoms: string[];
}

export interface SymptomReportCreate {
  district_id: string;
  block: string;
  village: string;
  species: string;
  breed?: string;
  num_affected: number;
  num_dead: number;
  symptoms: string[];
  severity: string;
  suspected_disease?: string;
  description?: string;
  reporter_type: string;
  reporter_name?: string;
  reporter_phone?: string;
  lat?: number;
  lon?: number;
  language: string;
  offline_synced?: boolean;
}

export interface LivestockAlert {
  id: number;
  alert_id: string;
  alert_type: string;
  severity: string;
  status: string;
  district_id: string;
  block?: string;
  village?: string;
  disease?: string;
  species?: string;
  message_en: string;
  message_hi?: string;
  message_mr?: string;
  triggered_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  details_json?: Record<string, unknown>;
}

export interface AnimalRecord {
  id: number;
  animal_id: string;
  ear_tag?: string;
  species: string;
  breed?: string;
  age_months?: number;
  sex?: string;
  owner_id?: string;
  owner_name?: string;
  village?: string;
  block?: string;
  district_id: string;
  state: string;
  registered_at: string;
  is_active: boolean;
}

export interface AnimalProfile {
  animal: AnimalRecord;
  vaccinations: VaccinationRecord[];
  treatments: TreatmentRecord[];
  lab_samples: LabSampleRecord[];
}

export interface VaccinationRecord {
  id: number;
  vaccine_name: string;
  disease_target: string;
  batch_number?: string;
  administered_by?: string;
  administered_at: string;
  next_due?: string;
  campaign_name?: string;
}

export interface TreatmentRecord {
  id: number;
  diagnosis: string;
  symptoms_observed?: string[];
  drugs_administered?: { drug: string; dose: string; route: string }[];
  outcome?: string;
  treated_by?: string;
  treated_at: string;
  follow_up_date?: string;
}

export interface LabSampleRecord {
  id?: number;
  sample_id: string;
  district_id?: string;
  sample_type: string;
  species?: string;
  suspected_disease?: string;
  status: string;
  result?: string;
  pathogen_identified?: string;
  collection_date: string;
}

export interface DashboardSummary {
  district_id: string;
  district_name: string;
  total_reports_this_week: number;
  active_alerts: number;
  vaccination_coverage_pct: number;
  mortality_rate: number;
  pending_lab_samples: number;
  total_animals_registered: number;
  diseases_active: string[];
}

export interface DashboardTrend {
  week_start: string;
  reported_cases: number;
  deaths: number;
  reports: number;
  alerts: number;
}

export interface PipelineStats {
  district_id: string;
  collected: number;
  in_transit: number;
  received: number;
  testing: number;
  result_available: number;
  total: number;
  [key: string]: string | number;
}

// ── API Functions ────────────────────────────────────────────────

export async function fetchLivestockDistricts(): Promise<LivestockDistrict[]> {
  try {
    const res = await fetch(`${API_BASE}/livestock/districts`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend API unreachable for livestock districts:", e);
  }
  // Static fallback
  try {
    const fallback = await fetch("/data/livestock_static.json");
    const data = await fallback.json();
    return data.districts || [];
  } catch {
    return [];
  }
}

export async function submitSymptomReport(report: SymptomReportCreate): Promise<SymptomReport> {
  const res = await fetch(`${API_BASE}/livestock/reports/symptom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error(`Failed to submit report: ${res.status}`);
  return res.json();
}

export async function evaluateTriageOnly(report: SymptomReportCreate): Promise<TriageResult> {
  try {
    const res = await fetch(`${API_BASE}/livestock/triage/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (res.ok) return res.json();
  } catch {
    // Offline fallback: basic rule matching
  }
  return {
    suspected_diseases: [],
    alert_recommended: false,
    triage_notes: "Offline mode — triage will run when connectivity is restored.",
  };
}

export async function fetchReports(
  params: { district_id?: string; species?: string; disease?: string; limit?: number } = {}
): Promise<SymptomReport[]> {
  try {
    const qs = new URLSearchParams();
    if (params.district_id) qs.set("district_id", params.district_id);
    if (params.species) qs.set("species", params.species);
    if (params.disease) qs.set("disease", params.disease);
    if (params.limit) qs.set("limit", String(params.limit));
    const res = await fetch(`${API_BASE}/livestock/reports?${qs}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn("API unreachable for reports:", e);
  }
  return [];
}

export async function fetchAlerts(
  params: { district_id?: string; severity?: string; status?: string } = {}
): Promise<LivestockAlert[]> {
  try {
    const qs = new URLSearchParams();
    if (params.district_id) qs.set("district_id", params.district_id);
    if (params.severity) qs.set("severity", params.severity);
    if (params.status) qs.set("status", params.status);
    const res = await fetch(`${API_BASE}/livestock/alerts?${qs}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn("API unreachable for alerts:", e);
  }
  return [];
}

export async function acknowledgeAlert(alertId: string, by: string): Promise<LivestockAlert | null> {
  try {
    const res = await fetch(`${API_BASE}/livestock/alerts/${alertId}/acknowledge`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acknowledged_by: by }),
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn("API unreachable:", e);
  }
  return null;
}

export async function fetchAnimals(
  params: { district_id?: string; species?: string; ear_tag?: string; limit?: number } = {}
): Promise<AnimalRecord[]> {
  try {
    const qs = new URLSearchParams();
    if (params.district_id) qs.set("district_id", params.district_id);
    if (params.species) qs.set("species", params.species);
    if (params.ear_tag) qs.set("ear_tag", params.ear_tag);
    if (params.limit) qs.set("limit", String(params.limit));
    const res = await fetch(`${API_BASE}/livestock/animals?${qs}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn("API unreachable for animals:", e);
  }
  return [];
}

export async function fetchAnimalProfile(animalId: string): Promise<AnimalProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/livestock/animals/${animalId}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn("API unreachable for animal profile:", e);
  }
  return null;
}

export async function fetchDashboardSummary(districtId?: string): Promise<DashboardSummary | null> {
  try {
    const qs = districtId ? `?district_id=${districtId}` : "";
    const res = await fetch(`${API_BASE}/livestock/dashboard/summary${qs}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn("API unreachable for dashboard:", e);
  }
  return null;
}

export async function fetchDashboardTrends(
  params: { district_id?: string; disease?: string; weeks?: number } = {}
): Promise<{ trends: DashboardTrend[] }> {
  try {
    const qs = new URLSearchParams();
    if (params.district_id) qs.set("district_id", params.district_id);
    if (params.disease) qs.set("disease", params.disease);
    if (params.weeks) qs.set("weeks", String(params.weeks));
    const res = await fetch(`${API_BASE}/livestock/dashboard/trends?${qs}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    // fallback
  }
  return { trends: [] };
}

export async function fetchLabPipelineStats(districtId?: string): Promise<PipelineStats | null> {
  try {
    const qs = districtId ? `?district_id=${districtId}` : "";
    const res = await fetch(`${API_BASE}/livestock/lab/pipeline-stats${qs}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    // fallback
  }
  return null;
}

export async function fetchLabSamples(
  params: { district_id?: string; status?: string } = {}
): Promise<LabSampleRecord[]> {
  try {
    const qs = new URLSearchParams();
    if (params.district_id) qs.set("district_id", params.district_id);
    if (params.status) qs.set("status", params.status);
    const res = await fetch(`${API_BASE}/livestock/lab/samples?${qs}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    // fallback
  }
  return [];
}

export async function fetchDistrictLeaderboard(): Promise<{ leaderboard: Record<string, unknown>[] }> {
  try {
    const res = await fetch(`${API_BASE}/livestock/dashboard/leaderboard`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    // fallback
  }
  return { leaderboard: [] };
}

export async function batchSyncReports(reports: SymptomReportCreate[]): Promise<{
  synced: number; failed: number; report_ids: string[]; errors: string[];
}> {
  const res = await fetch(`${API_BASE}/livestock/reports/batch-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reports }),
  });
  if (!res.ok) throw new Error("Batch sync failed");
  return res.json();
}

export async function fetchVaccinationCoverage(
  params: { district_id?: string; disease_target?: string } = {}
): Promise<Record<string, unknown>> {
  try {
    const qs = new URLSearchParams();
    if (params.district_id) qs.set("district_id", params.district_id);
    if (params.disease_target) qs.set("disease_target", params.disease_target);
    const res = await fetch(`${API_BASE}/livestock/animals/vaccination-coverage?${qs}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    // fallback
  }
  return { coverage_pct: 0 };
}
