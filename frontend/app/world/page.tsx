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
  cases: "#00FFFF",
  deaths: "#FF3333",
  recovered: "rgba(255,255,255,0.6)",
  active: "rgba(255,255,255,0.85)",
  critical: "#FF3333",
};

const PIE_PALETTE = ["#00FFFF", "rgba(255,255,255,0.7)", "rgba(255,255,255,0.4)", "#FF3333", "rgba(0,255,255,0.5)", "rgba(255,255,255,0.3)"];

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
    <div className="flex flex-col min-h-screen text-[var(--bp-white-soft)] font-mono">
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--bp-line-faint)] px-6 py-4 backdrop-blur-md" style={{ background: 'rgba(0, 30, 60, 0.9)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 border border-[var(--bp-line-faint)] flex items-center justify-center text-lg hover:border-[var(--bp-cyan)] transition" style={{ color: 'var(--bp-white-soft)' }}>
              ←
            </Link>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--bp-white-soft)' }}>
                <span className="bp-serial">[WLD-01]</span> Global Context Surveillance
              </h1>
              <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>Live Global Disease Monitoring via disease.sh</p>
            </div>
          </div>

          <Link href="/" className="bp-btn bp-btn-active text-[9px]">
            🇮🇳 INDIA DISTRICT ENGINE
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--bp-white-muted)' }}>
            <span className="bp-serial">[SEC-01]</span> Global Overview
          </h2>
          {global && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Total Cases" value={global.cases} color={COLORS.cases} serial="G-01" />
              <StatCard label="Deaths" value={global.deaths} color={COLORS.deaths} serial="G-02" />
              <StatCard label="Recovered" value={global.recovered} color={COLORS.recovered} serial="G-03" />
              <StatCard label="Active" value={global.active} color={COLORS.active} serial="G-04" />
              <StatCard label="Critical" value={global.critical} color={COLORS.critical} serial="G-05" />
              <StatCard label="Countries" value={global.affectedCountries} color="var(--bp-cyan)" serial="G-06" />
            </div>
          )}
        </section>

        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 blueprint-card p-4">
            <div className="bp-corners">
              <span className="corner-tr">+</span>
              <span className="corner-bl">+</span>
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--bp-white-soft)' }}>
              <span className="bp-serial">[MAP-01]</span> World Disease Map
            </h3>
            <WorldMap countries={countries} />
          </div>

          <div className="lg:col-span-2 blueprint-card p-6">
            <div className="bp-corners">
              <span className="corner-tr">+</span>
              <span className="corner-bl">+</span>
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--bp-white-soft)' }}>
              <span className="bp-serial">[CHT-01]</span> 120-Day Global Trend
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradWorldCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)", fontFamily: "'Roboto Mono', monospace" }} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)", fontFamily: "'Roboto Mono', monospace" }} />
                  <Tooltip
                    contentStyle={{
                      background: "#002244",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "0px",
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "10px",
                      fontFamily: "'Roboto Mono', monospace",
                    }}
                  />
                  <Area type="monotone" dataKey="cases" stroke="#00FFFF" fill="url(#gradWorldCases)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, color, serial }: { label: string; value: number; color: string; serial: string }) {
  return (
    <div className="stat-card">
      <p className="bp-serial mb-1">[{serial}] {label.toUpperCase()}</p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>
        {formatNum(value)}
      </p>
    </div>
  );
}
