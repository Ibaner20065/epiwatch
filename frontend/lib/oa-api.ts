// SwasthSandhi OA API client — mirrors EpiWatch's api-client.ts resilience
// pattern: try the FastAPI backend, fall back to static JSON offline.

const API_BASE = process.env.NEXT_API_URL || "https://epiwatch-xrhv.onrender.com";

export interface OAScreeningInput {
  patient: {
    age: number;
    sex: string;
    bmi: number;
    occupation: string;
    activity_level: number;
    prior_joint_injury: boolean;
    family_history_oa: boolean;
    diabetes: boolean;
    terrain_factor: number;
    ner_district: string;
    language: string;
  };
  screening: {
    womac_pain: number;
    womac_stiffness: number;
    womac_function: number;
    joint_knee: boolean;
    joint_hip: boolean;
    joint_hand: boolean;
    joint_spine: boolean;
    crepitus: boolean;
    joint_swelling: boolean;
    morning_stiffness_min: number;
  };
}

export interface OARiskResult {
  patient_id: string;
  risk_probability: number;
  risk_tier: "Low" | "Medium" | "High" | "Critical";
  risk_source: string;
  top_factors: { factor: string; value: string; importance: number }[] | string[];
  referral_required: boolean;
  disclaimer?: string;
}

export interface OAModelStatus {
  available: boolean;
  models: Record<string, OAModelMetric>;
  engine?: string;
}

export interface OANerRegion {
  code: string;
  name: string;
  state: string;
  language: string;
}

export interface OALanguage {
  code: string;
  name: string;
  name_en: string;
}

export interface OANerRegions {
  regions: OANerRegion[];
  languages: OALanguage[];
}

export interface OAModelMetric {
  roc_auc?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
}

export async function submitOAScreening(input: OAScreeningInput): Promise<OARiskResult> {
  try {
    const res = await fetch(`${API_BASE}/oa/screening`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("OA backend unreachable for screening:", e);
  }
  // Offline fallback: transparent clinical rules scoring (client-side)
  return computeOARulesFallback(input);
}

export async function fetchOAModelStatus(): Promise<OAModelStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/oa/model-status`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("OA backend unreachable for model-status:", e);
  }
  try {
    const staticData = await fetch("/data/oa_static.json");
    const data = await staticData.json();
    return { available: data.model?.available ?? false, models: data.model?.metrics ?? {} };
  } catch {
    return null;
  }
}

export async function fetchOANerRegions(): Promise<OANerRegions | null> {
  try {
    const res = await fetch(`${API_BASE}/oa/ner-regions`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("OA backend unreachable for ner-regions:", e);
  }
  try {
    const staticData = await fetch("/data/oa_static.json");
    const data = await staticData.json();
    return { regions: data.regions ?? [], languages: data.languages ?? [] };
  } catch {
    return null;
  }
}

// ── Offline clinical-rules fallback (mirrors backend oa_engine.compute_rule_tier) ──
function computeOARulesFallback(input: OAScreeningInput): OARiskResult {
  const p = input.patient;
  const s = input.screening;
  let score = 0;
  const reasons: string[] = [];

  if (p.age >= 60) { score += 2; reasons.push("Age >= 60 (strong risk)"); }
  else if (p.age >= 50) { score += 1; reasons.push("Age 50-59"); }
  if (p.bmi >= 30) { score += 2; reasons.push("Obesity (BMI >= 30)"); }
  else if (p.bmi >= 27) { score += 1; reasons.push("Overweight"); }
  if (p.sex === "female") { score += 1; reasons.push("Female sex"); }
  if (p.occupation === "agriculture" || p.occupation === "domestic") { score += 2; reasons.push("High-load occupation"); }
  else if (p.occupation === "trade") { score += 1; reasons.push("Prolonged standing"); }
  if (p.prior_joint_injury) { score += 2; reasons.push("Prior joint injury"); }
  if (p.family_history_oa) { score += 1; reasons.push("Family history"); }
  if (p.diabetes) { score += 1; reasons.push("Diabetes"); }
  const total = s.womac_pain + s.womac_stiffness + s.womac_function;
  if (total >= 180) { score += 2; reasons.push("Severe WOMAC burden"); }
  else if (total >= 90) { score += 1; reasons.push("Moderate WOMAC burden"); }
  if (s.morning_stiffness_min >= 60) { score += 2; reasons.push("Marked morning stiffness"); }
  else if (s.morning_stiffness_min >= 30) { score += 1; reasons.push("Morning stiffness"); }
  if (s.crepitus) { score += 1; reasons.push("Crepitus"); }

  const tier: OARiskResult["risk_tier"] = score >= 10 ? "Critical" : score >= 7 ? "High" : score >= 4 ? "Medium" : "Low";
  return {
    patient_id: "OFFLINE",
    risk_probability: Math.min(0.97, Math.max(0.05, score / 13)),
    risk_tier: tier,
    risk_source: "clinical_rules (offline)",
    top_factors: reasons,
    referral_required: tier === "High" || tier === "Critical",
    disclaimer: "Computed offline via transparent clinical rules. Connect to the backend ML engine for SHAP-grounded results.",
  };
}
