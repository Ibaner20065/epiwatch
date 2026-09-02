"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchLivestockDistricts, fetchDashboardSummary, fetchAlerts, LivestockDistrict, DashboardSummary, LivestockAlert } from "@/lib/livestock-api";

const QUICK_LINKS = [
  { href: "/livestock/report", icon: "📋", title: "Report Disease", desc: "Submit symptom or mortality report" },
  { href: "/livestock/map", icon: "🗺️", title: "Risk Map", desc: "Geospatial disease risk mapping" },
  { href: "/livestock/dashboard", icon: "📊", title: "Dashboard", desc: "KPIs and trend analysis" },
  { href: "/livestock/animals", icon: "🐄", title: "Animal Records", desc: "Vaccination & treatment history" },
  { href: "/livestock/lab", icon: "🔬", title: "Lab Referral", desc: "Sample tracking & results" },
  { href: "/livestock/alerts", icon: "🚨", title: "Alerts", desc: "Active alerts & escalation" },
];

const SEVERITY_COLORS: Record<string, string> = {
  watch: "#22c55e",
  warning: "#eab308",
  outbreak: "#ef4444",
  emergency: "#dc2626",
};

const SEVERITY_ICONS: Record<string, string> = {
  watch: "🟢",
  warning: "🟡",
  outbreak: "🔴",
  emergency: "⚫",
};

export default function LivestockHome() {
  const [districts, setDistricts] = useState<LivestockDistrict[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<LivestockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchLivestockDistricts(),
      fetchDashboardSummary(),
      fetchAlerts({ status: "active" }),
    ])
      .then(([d, s, a]) => {
        setDistricts(d);
        setSummary(s);
        setAlerts(a.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl mb-8 p-8 md:p-12" style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(139,105,20,0.1) 50%, rgba(15,25,40,0.95) 100%)",
        border: "1px solid rgba(212,175,55,0.2)",
      }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{
          background: "radial-gradient(circle, #d4af37 0%, transparent 70%)",
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🐄</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-wide" style={{ color: "#d4af37" }}>
                PashuRaksha
              </h1>
              <p className="text-sm tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                पशुरक्षा — पशु आरोग्य देखरेख
              </p>
            </div>
          </div>
          <p className="text-base md:text-lg mt-4 max-w-2xl" style={{ color: "rgba(255,255,255,0.7)" }}>
            Animal Health Surveillance &amp; Decision Support System for <strong style={{ color: "#d4af37" }}>Maharashtra</strong>.
            Early warning, rapid reporting, and coordinated veterinary response across {districts.length || 9} districts.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/livestock/report" className="no-underline px-5 py-2.5 rounded-lg text-sm font-semibold transition-all" style={{
              background: "linear-gradient(135deg, #d4af37, #8b6914)",
              color: "#0a1628",
              boxShadow: "0 4px 15px rgba(212,175,55,0.3)",
            }}>
              📋 Report Disease
            </Link>
            <Link href="/livestock/dashboard" className="no-underline px-5 py-2.5 rounded-lg text-sm font-semibold transition-all" style={{
              background: "rgba(212,175,55,0.1)",
              color: "#d4af37",
              border: "1px solid rgba(212,175,55,0.3)",
            }}>
              📊 View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── KPI Cards ────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Districts Monitored", value: districts.length || 9, icon: "📍", color: "#22d3ee" },
          { label: "Active Alerts", value: summary?.active_alerts ?? alerts.length, icon: "🚨", color: "#ef4444" },
          { label: "Diseases Tracked", value: 5, icon: "🦠", color: "#a855f7" },
          { label: "Species Covered", value: 5, icon: "🐾", color: "#22c55e" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4 transition-all" style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{kpi.icon}</span>
              <span className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{kpi.label}</p>
          </div>
        ))}
      </section>

      {/* ── Quick Links Grid ─────────────────────── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl p-5 no-underline transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(212,175,55,0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)";
                e.currentTarget.style.background = "rgba(212,175,55,0.05)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,55,0.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span className="text-3xl mb-3 block">{link.icon}</span>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "#d4af37" }}>{link.title}</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Alerts ────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Recent Alerts</h2>
          <Link href="/livestock/alerts" className="text-xs no-underline" style={{ color: "#d4af37" }}>View All →</Link>
        </div>
        <div className="space-y-3">
          {alerts.length === 0 && !loading && (
            <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                No active alerts. System operational. ✅
              </p>
            </div>
          )}
          {alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderLeft: `3px solid ${SEVERITY_COLORS[alert.severity] || "#888"}`,
              }}
            >
              <span className="text-lg mt-0.5">{SEVERITY_ICONS[alert.severity] || "⚪"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{
                    background: `${SEVERITY_COLORS[alert.severity]}20`,
                    color: SEVERITY_COLORS[alert.severity],
                  }}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {alert.district_id} • {alert.disease || "General"}
                  </span>
                </div>
                <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {alert.message_en}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Districts Overview ───────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
          Maharashtra Districts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {districts.slice(0, 9).map((d) => (
            <div key={d.id} className="rounded-xl p-4" style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{ color: "#d4af37" }}>{d.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{
                  background: "rgba(212,175,55,0.1)", color: "rgba(212,175,55,0.7)"
                }}>
                  {d.division}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                <div>🐄 {(d.cattle_population / 1000).toFixed(0)}K</div>
                <div>🐃 {(d.buffalo_population / 1000).toFixed(0)}K</div>
                <div>🐐 {(d.goat_population / 1000).toFixed(0)}K</div>
              </div>
              <div className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Total: {((d.total_livestock || 0) / 1000).toFixed(0)}K livestock
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="mt-12 pt-6 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          PashuRaksha — Animal Health Surveillance System • Dept. of Animal Husbandry, Dairy Development &amp; Fisheries, Govt. of Maharashtra
        </p>
        <p className="text-[10px] mt-1" style={{ color: "rgba(212,175,55,0.4)" }}>
          Helpline: 1800-233-0418 • Powered by EpiWatch AI Engine
        </p>
      </footer>
    </div>
  );
}
