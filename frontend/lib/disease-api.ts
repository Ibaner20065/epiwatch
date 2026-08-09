/* ─────────────────────────────────────────────────
   EpiWatch — External data API helpers
   All data sourced from free, no-auth REST APIs:
     • disease.sh  (COVID-19 global + per-country)
     • restcountries (demographics, flags)
   ───────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────
export interface GlobalDiseaseStats {
  updated: number;
  cases: number;
  todayCases: number;
  deaths: number;
  todayDeaths: number;
  recovered: number;
  todayRecovered: number;
  active: number;
  critical: number;
  casesPerOneMillion: number;
  deathsPerOneMillion: number;
  population: number;
  affectedCountries: number;
}

export interface CountryDiseaseStats {
  country: string;
  countryInfo: {
    _id: number;
    iso2: string;
    iso3: string;
    lat: number;
    long: number;
    flag: string;
  };
  cases: number;
  todayCases: number;
  deaths: number;
  todayDeaths: number;
  recovered: number;
  active: number;
  critical: number;
  casesPerOneMillion: number;
  deathsPerOneMillion: number;
  population: number;
  continent: string;
}

export interface HistoricalTimeline {
  cases: Record<string, number>;
  deaths: Record<string, number>;
  recovered: Record<string, number>;
}

export interface ContinentStats {
  continent: string;
  cases: number;
  deaths: number;
  recovered: number;
  active: number;
  population: number;
  countries: string[];
}

// ── Fetchers ───────────────────────────────────
const DISEASE_BASE = "https://disease.sh/v3/covid-19";

export async function fetchGlobalStats(): Promise<GlobalDiseaseStats> {
  const res = await fetch(`${DISEASE_BASE}/all`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Global stats failed: ${res.status}`);
  return res.json();
}

export async function fetchCountryStats(limit = 20): Promise<CountryDiseaseStats[]> {
  const res = await fetch(`${DISEASE_BASE}/countries?sort=cases`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Country stats failed: ${res.status}`);
  const data: CountryDiseaseStats[] = await res.json();
  return data.slice(0, limit);
}

export async function fetchAllCountryStats(): Promise<CountryDiseaseStats[]> {
  const res = await fetch(`${DISEASE_BASE}/countries?sort=cases`, { cache: "no-store" });
  if (!res.ok) throw new Error(`All country stats failed: ${res.status}`);
  return res.json();
}

export async function fetchHistoricalGlobal(days = 90): Promise<HistoricalTimeline> {
  const res = await fetch(`${DISEASE_BASE}/historical/all?lastdays=${days}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Historical data failed: ${res.status}`);
  return res.json();
}

export async function fetchContinentStats(): Promise<ContinentStats[]> {
  const res = await fetch(`${DISEASE_BASE}/continents?sort=cases`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Continent stats failed: ${res.status}`);
  return res.json();
}

// ── Formatting helpers ─────────────────────────
export function formatNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
