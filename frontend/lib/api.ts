export const API_BASE = process.env.NEXT_API_URL ?? "https://epiwatch-xrhv.onrender.com";

export type HealthResponse = {
  status: string;
  database: { ok: boolean; result?: number; error?: string };
  message?: string;
};

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
  return res.json();
}
