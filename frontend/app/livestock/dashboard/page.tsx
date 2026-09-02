"use client";

import { useEffect, useState } from "react";
import { fetchDashboardSummary, fetchDashboardTrends, fetchDistrictLeaderboard, DashboardSummary, DashboardTrend, fetchLivestockDistricts, LivestockDistrict } from "@/lib/livestock-api";

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
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#d4af37" }}>📊 Official Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Situational awareness for veterinary officials — Maharashtra
          </p>
        </div>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <option value="">All Maharashtra</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* ── KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Reports This Week", value: summary?.total_reports_this_week ?? 0, icon: "📋", color: "#22d3ee" },
          { label: "Active Alerts", value: summary?.active_alerts ?? 0, icon: "🚨", color: "#ef4444" },
          { label: "Vaccination Coverage", value: `${summary?.vaccination_coverage_pct ?? 0}%`, icon: "💉", color: "#22c55e" },
          { label: "Mortality Rate", value: `${summary?.mortality_rate ?? 0}%`, icon: "💀", color: "#f97316" },
          { label: "Pending Lab Samples", value: summary?.pending_lab_samples ?? 0, icon: "🔬", color: "#a855f7" },
          { label: "Registered Animals", value: summary?.total_animals_registered ?? 0, icon: "🐄", color: "#d4af37" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span>{kpi.icon}</span>
              <span className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</span>
            </div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ── Trends Chart (CSS bar chart) ─────────── */}
      <div className="rounded-xl p-6 mb-8" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          Weekly Disease Reports — Last 12 Weeks
        </h2>
        <div className="flex items-end gap-2 h-40">
          {trends.map((t, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.reported_cases}</span>
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${(t.reported_cases / maxCases) * 100}%`,
                  minHeight: "4px",
                  background: t.alerts > 0
                    ? "linear-gradient(180deg, #ef4444, rgba(239,68,68,0.3))"
                    : "linear-gradient(180deg, #d4af37, rgba(212,175,55,0.3))",
                }}
              />
              <span className="text-[8px] -rotate-45 origin-top-left whitespace-nowrap" style={{ color: "rgba(255,255,255,0.3)" }}>
                {t.week_start.slice(5)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="w-3 h-3 rounded" style={{ background: "#d4af37" }} /> Normal
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="w-3 h-3 rounded" style={{ background: "#ef4444" }} /> Week with alerts
          </span>
        </div>
      </div>

      {/* ── District Leaderboard ─────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            District Comparison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: "rgba(255,255,255,0.4)" }}>
                <th className="text-left px-6 py-3">District</th>
                <th className="text-left px-4 py-3">Division</th>
                <th className="text-center px-4 py-3">Reports/Week</th>
                <th className="text-center px-4 py-3">Active Alerts</th>
                <th className="text-center px-4 py-3">Deaths/Week</th>
                <th className="text-right px-6 py-3">Total Livestock</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <td className="px-6 py-3 font-medium" style={{ color: "#d4af37" }}>
                    {String(row.district_name)}
                  </td>
                  <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {String(row.division || "")}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {String(row.reports_this_week)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded" style={{
                      background: Number(row.active_alerts) > 0 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                      color: Number(row.active_alerts) > 0 ? "#ef4444" : "#22c55e",
                    }}>
                      {String(row.active_alerts)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {String(row.deaths_this_week)}
                  </td>
                  <td className="px-6 py-3 text-right" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {Number(row.total_livestock) > 0 ? `${(Number(row.total_livestock) / 1000).toFixed(0)}K` : "-"}
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {loading ? "Loading..." : "No data available"}
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
