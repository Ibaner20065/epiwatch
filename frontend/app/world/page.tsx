"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  fetchGlobalStats,
  fetchCountryStats,
  fetchHistoricalGlobal,
  fetchContinentStats,
  GlobalDiseaseStats,
  CountryDiseaseStats,
  HistoricalTimeline,
  ContinentStats,
  formatNum,
} from "@/lib/disease-api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const WorldMap = dynamic(() => import("@/app/components/WorldMap"), { ssr: false });

export default function WorldPage() {
  const [global, setGlobal] = useState<GlobalDiseaseStats | null>(null);
  const [countries, setCountries] = useState<CountryDiseaseStats[]>([]);
  const [history, setHistory] = useState<HistoricalTimeline | null>(null);
  const [, setContinents] = useState<ContinentStats[]>([]);
  const [, setError] = useState<string | null>(null);
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
    return Object.entries(history.cases).map(([date, cases]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cases,
    }));
  }, [history]);

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "var(--font-sans)", background: "var(--surface-muted)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 px-6 py-3.5"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px var(--border)",
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="ew-btn-secondary text-sm no-underline"
              style={{ width: 36, height: 36, padding: 0, borderRadius: "var(--radius-md)" }}
            >
              ←
            </Link>
            <div>
              <h1 className="text-base font-bold" style={{ color: "var(--fg)" }}>
                Global Pandemic Context Surveillance
              </h1>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                International Disease Monitoring via disease.sh feeds
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="ew-btn-primary text-xs no-underline font-semibold"
            style={{ height: 36, padding: "0 14px", borderRadius: "var(--radius-md)" }}
          >
            🇮🇳 India District Engine
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* ── KPI Stat Cards (High Contrast, Pure White) ── */}
        <section>
          <span className="ew-eyebrow mb-2 block">Global Epidemiological Totals</span>
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="t-skeleton-reveal h-24 w-full" />
              ))}
            </div>
          )}

          {global && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Total Cases" value={global.cases} color="#2563eb" />
              <StatCard label="Total Mortalities" value={global.deaths} color="#dc2626" />
              <StatCard label="Recovered" value={global.recovered} color="#16a34a" />
              <StatCard label="Active Infections" value={global.active} color="#d97706" />
              <StatCard label="Critical Cases" value={global.critical} color="#b91c1c" />
              <StatCard label="Nations Tracked" value={global.affectedCountries} color="#7c3aed" />
            </div>
          )}
        </section>

        {/* ── Map and Trend Charts ── */}
        <section className="grid lg:grid-cols-5 gap-6">
          <div
            className="lg:col-span-3 ew-card p-5 bg-white"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="ew-eyebrow">Interactive Global Map</span>
                <h3 className="text-base font-bold mt-0.5" style={{ color: "var(--fg)" }}>
                  Worldwide Country Incidence Surface
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-gray-500">
                {countries.length} Nations
              </span>
            </div>
            <WorldMap countries={countries} />
          </div>

          <div
            className="lg:col-span-2 ew-card p-6 bg-white flex flex-col justify-between"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="ew-eyebrow">Temporal Wave</span>
                  <h3 className="text-base font-bold mt-0.5" style={{ color: "var(--fg)" }}>
                    120-Day Global Trend
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>
                  Daily Grain
                </span>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gradWorldCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-start)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--brand-start)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--fg)",
                        fontSize: "12px",
                        fontFamily: "var(--font-mono)",
                        boxShadow: "var(--shadow-card)",
                      }}
                      formatter={(val: any) => [formatNum(Number(val)) + " cases", "Global Cases"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="cases"
                      stroke="var(--brand-start)"
                      fill="url(#gradWorldCases)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-500">
              <span>Feed: Open Disease Data API</span>
              <span>Updated Hourly</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="ew-stat-card bg-white p-4"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
      }}
    >
      <p className="ew-eyebrow mb-1">{label}</p>
      <p className="ew-data-lg font-mono font-bold" style={{ color, fontSize: 24 }}>
        {formatNum(value)}
      </p>
    </div>
  );
}
