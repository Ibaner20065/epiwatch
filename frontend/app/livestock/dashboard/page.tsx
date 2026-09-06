"use client";

import { useEffect, useState } from "react";
import {
  fetchDashboardSummary,
  fetchDashboardTrends,
  fetchDistrictLeaderboard,
  DashboardSummary,
  DashboardTrend,
  fetchLivestockDistricts,
  LivestockDistrict,
} from "@/lib/livestock-api";

export default function DashboardPage() {
  const [districts, setDistricts] = useState<LivestockDistrict[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrend[]>([]);
  const [leaderboard, setLeaderboard] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLivestockDistricts().then(setDistricts).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDashboardSummary(selectedDistrict || undefined),
      fetchDashboardTrends({ district_id: selectedDistrict || undefined, weeks: 12 }),
      fetchDistrictLeaderboard(),
    ])
      .then(([s, t, l]) => {
        setSummary(s);
        setTrends(t.trends || []);
        setLeaderboard(l.leaderboard || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDistrict]);

  const maxCases = Math.max(...trends.map((t) => t.reported_cases), 1);

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            📊 Veterinary Officer Surveillance Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Official situational awareness &amp; epidemiological trend analysis — Maharashtra DAHD
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold" style={{ color: "var(--fg-2)" }}>
            District Scope:
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="ew-select text-xs font-semibold"
            style={{ width: "auto", minWidth: 180, height: 40 }}
          >
            <option value="">All 34 Maharashtra Districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── High Contrast KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Reports This Week",
            value: summary?.total_reports_this_week ?? 0,
            icon: "📋",
            color: "#2563eb",
          },
          {
            label: "Active Alerts",
            value: summary?.active_alerts ?? 0,
            icon: "🚨",
            color: "#dc2626",
          },
          {
            label: "Vaccine Coverage",
            value: `${summary?.vaccination_coverage_pct ?? 0}%`,
            icon: "💉",
            color: "#16a34a",
          },
          {
            label: "Mortality Rate",
            value: `${summary?.mortality_rate ?? 0}%`,
            icon: "💀",
            color: "#ea580c",
          },
          {
            label: "Pending Lab Tests",
            value: summary?.pending_lab_samples ?? 0,
            icon: "🔬",
            color: "#7c3aed",
          },
          {
            label: "Monitored Herds",
            value: summary?.total_animals_registered ?? "32.5M",
            icon: "🐄",
            color: "#0891b2",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="ew-card p-4 bg-white"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{kpi.icon}</span>
              <span
                className="ew-data-lg font-mono font-bold"
                style={{ color: kpi.color, fontSize: 22 }}
              >
                {kpi.value}
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--fg)" }}>
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Trends Chart (High Contrast Pure White Card) ── */}
      <div
        className="ew-card p-6 bg-white"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="ew-eyebrow">Temporal Incidence Curve</span>
            <h2 className="text-base font-bold mt-0.5" style={{ color: "var(--fg)" }}>
              Weekly Disease Reports — Prior 12 Weeks
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5" style={{ color: "var(--fg-2)" }}>
              <span className="w-3 h-3 rounded" style={{ background: "var(--accent)" }} /> Baseline
              Surveillance
            </span>
            <span className="flex items-center gap-1.5" style={{ color: "var(--danger)" }}>
              <span className="w-3 h-3 rounded bg-red-600" /> Outbreak Threshold Breach
            </span>
          </div>
        </div>

        <div className="flex items-end gap-3 h-48 pt-4 pb-2 border-b border-gray-100">
          {trends.map((t, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-mono font-bold" style={{ color: "var(--fg)" }}>
                {t.reported_cases}
              </span>
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${(t.reported_cases / maxCases) * 100}%`,
                  minHeight: "6px",
                  background:
                    t.alerts > 0
                      ? "linear-gradient(180deg, #dc2626, #ef4444)"
                      : "linear-gradient(180deg, var(--brand-start), var(--brand-end))",
                  boxShadow:
                    t.alerts > 0
                      ? "0 2px 8px rgba(220, 38, 38, 0.3)"
                      : "0 2px 8px rgba(79, 110, 247, 0.2)",
                }}
              />
              <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--muted)" }}>
                {t.week_start.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── District Comparison Leaderboard ── */}
      <div
        className="ew-card overflow-hidden bg-white"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <span className="ew-eyebrow">District Ranking Matrix</span>
            <h2 className="text-base font-bold mt-0.5" style={{ color: "var(--fg)" }}>
              Maharashtra Taluka &amp; District Surveillance Comparison
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>
            Ranked by Morbidity
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="ew-table">
            <thead>
              <tr>
                <th>District Name</th>
                <th>Revenue Division</th>
                <th className="text-center">Reports / Wk</th>
                <th className="text-center">Active Alerts</th>
                <th className="text-center">Deaths / Wk</th>
                <th className="text-right">Census Herd Size</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={i}>
                  <td className="font-bold" style={{ color: "var(--fg)" }}>
                    {String(row.district_name)}
                  </td>
                  <td style={{ color: "var(--fg-2)" }}>{String(row.division || "Maharashtra")}</td>
                  <td className="text-center font-mono font-semibold" style={{ color: "var(--fg)" }}>
                    {String(row.reports_this_week)}
                  </td>
                  <td className="text-center">
                    <span
                      className="px-2.5 py-0.5 rounded font-mono text-xs font-bold"
                      style={{
                        background:
                          Number(row.active_alerts) > 0
                            ? "rgba(220, 38, 38, 0.12)"
                            : "rgba(22, 163, 74, 0.12)",
                        color: Number(row.active_alerts) > 0 ? "var(--danger)" : "var(--success)",
                      }}
                    >
                      {String(row.active_alerts)}
                    </span>
                  </td>
                  <td className="text-center font-mono font-semibold" style={{ color: "var(--fg)" }}>
                    {String(row.deaths_this_week)}
                  </td>
                  <td className="text-right font-mono font-bold" style={{ color: "var(--accent)" }}>
                    {Number(row.total_livestock) > 0
                      ? `${(Number(row.total_livestock) / 1000).toFixed(0)}K`
                      : "—"}
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center" style={{ color: "var(--muted)" }}>
                    {loading ? "Loading surveillance feeds..." : "No records found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
