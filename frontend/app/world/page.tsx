"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  fetchGlobalStats,
  fetchCountryStats,
  fetchHistoricalGlobal,
  fetchContinentStats,
  formatNum,
  timeAgo,
  type GlobalDiseaseStats,
  type CountryDiseaseStats,
  type HistoricalTimeline,
  type ContinentStats,
} from "@/lib/disease-api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const WorldMap = dynamic(() => import("@/app/components/WorldMap"), { ssr: false });

const COLORS = {
  cases: "#6366f1",
  deaths: "#f43f5e",
  recovered: "#34d399",
  active: "#fbbf24",
  critical: "#fb923c",
};

const PIE_PALETTE = ["#6366f1", "#22d3ee", "#34d399", "#fbbf24", "#f43f5e", "#a78bfa"];

export default function WorldPage() {
  const [global, setGlobal] = useState<GlobalDiseaseStats | null>(null);
  const [countries, setCountries] = useState<CountryDiseaseStats[]>([]);
  const [history, setHistory] = useState<HistoricalTimeline | null>(null);
  const [continents, setContinents] = useState<ContinentStats[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchGlobalStats(),
      fetchCountryStats(30),
      fetchHistoricalGlobal(120),
      fetchContinentStats(),
    ])
      .then(([g, c, h, ct]) => {
        setGlobal(g);
        setCountries(c);
        setHistory(h);
        setContinents(ct);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!history) return [];
    const dates = Object.keys(history.cases);
    return dates.map((d) => ({
      date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cases: history.cases[d],
      deaths: history.deaths[d],
      recovered: history.recovered[d],
    }));
  }, [history]);

  const continentPieData = useMemo(
    () =>
      continents.map((c) => ({
        name: c.continent,
        value: c.cases,
        population: c.population,
        deaths: c.deaths,
      })),
    [continents]
  );

  const barData = useMemo(
    () =>
      countries.slice(0, 10).map((c) => ({
        country: c.country.length > 12 ? c.country.slice(0, 11) + "…" : c.country,
        cases: c.cases,
        deaths: c.deaths,
      })),
    [countries]
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#07070b] text-slate-100">
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border)] px-6 py-4 backdrop-blur-md bg-[#09090f]/80">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Global Context Surveillance
              </h1>
              <p className="text-xs text-slate-400">Live Global Disease Monitoring via disease.sh</p>
            </div>
          </div>

          <Link href="/" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
            🇮🇳 India District Engine
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-medium uppercase tracking-widest text-slate-400 mb-4">
            Global Overview
          </h2>
          {global && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Total Cases" value={global.cases} color={COLORS.cases} />
              <StatCard label="Deaths" value={global.deaths} color={COLORS.deaths} />
              <StatCard label="Recovered" value={global.recovered} color={COLORS.recovered} />
              <StatCard label="Active" value={global.active} color={COLORS.active} />
              <StatCard label="Critical" value={global.critical} color={COLORS.critical} />
              <StatCard label="Countries" value={global.affectedCountries} color="#a78bfa" />
            </div>
          )}
        </section>

        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 p-4 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
              World Disease Map
            </h3>
            <WorldMap countries={countries} />
          </div>

          <div className="lg:col-span-2 p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
              120-Day Global Trend
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cases" stroke={COLORS.cases} fill={COLORS.cases} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>
        {formatNum(value)}
      </p>
    </div>
  );
}
