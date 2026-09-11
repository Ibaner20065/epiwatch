import { getApiBaseUrl } from "./config";

export type HealthResponse = {
  status: string;
  database: { ok: boolean; result?: number; error?: string };
  message?: string;
};

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
  return res.json();
}
