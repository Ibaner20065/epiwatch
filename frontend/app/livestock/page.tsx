"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchLivestockDistricts,
  fetchDashboardSummary,
  fetchAlerts,
  LivestockDistrict,
  DashboardSummary,
  LivestockAlert,
} from "@/lib/livestock-api";

const QUICK_LINKS = [
  {
    href: "/livestock/report",
    icon: "📋",
    title: "Report Disease",
    desc: "Submit clinical symptom or mortality events",
    badge: "Field Intake",
  },
  {
    href: "/livestock/map",
    icon: "🗺️",
    title: "Tehsil Risk Map",
    desc: "Geospatial disease vulnerability mapping",
    badge: "356 Tehsils",
  },
  {
    href: "/livestock/dashboard",
    icon: "📊",
    title: "Veterinary KPI Dashboard",
    desc: "Surveillance KPIs and historical trend models",
    badge: "MOSPI ML",
  },
  {
    href: "/livestock/animals",
    icon: "🐄",
    title: "Animal Records & Registry",
    desc: "Vaccination tracking & treatment records",
    badge: "Herd EHR",
  },
  {
    href: "/livestock/lab",
    icon: "🔬",
    title: "Lab Referral Pipeline",
    desc: "5-stage cold-chain monitoring & PCR results",
    badge: "Chain of Custody",
  },
  {
    href: "/livestock/alerts",
    icon: "🚨",
    title: "Early Warning Alerts",
    desc: "Active outbreak warnings & taluka escalation",
    badge: "Real-time",
  },
];

const SEVERITY_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  watch: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d", label: "WATCH" },
  warning: { bg: "rgba(217, 119, 6, 0.12)", text: "#b45309", label: "WARNING" },
  outbreak: { bg: "rgba(220, 38, 38, 0.12)", text: "#b91c1c", label: "OUTBREAK" },
  emergency: { bg: "rgba(185, 28, 28, 0.16)", text: "#991b1b", label: "EMERGENCY" },
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
    <div className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto space-y-8">
      {/* ── Hero Banner (High Contrast, Bold Indigo-Navy Surface) ── */}
      <section
        className="ew-card relative overflow-hidden p-8 md:p-10"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
          color: "#FFFFFF",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 4px 20px rgba(30, 58, 138, 0.25)",
        }}
      >
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Maharashtra DAHD &amp; MOSPI Surveillance Grid
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
            >
              356 Tehsils
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            PashuRaksha (पशurक्षा)
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-blue-100 mb-6">
            AI-powered rural livestock intelligence platform defending smallholder farmer
            livelihoods across 356 Maharashtra blocks. Fusing 19th Census herd demographics,
            111 national MOSPI machine-learning models, and real-time field triage.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/livestock/report"
              className="ew-btn-primary text-sm font-bold no-underline"
              style={{
                height: 44,
                padding: "0 22px",
                background: "#FFFFFF",
                color: "#1e3a8a",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                borderRadius: "var(--radius-md)",
              }}
            >
              📋 Report Disease Symptoms
            </Link>
            <Link
              href="/livestock/dashboard"
              className="ew-btn-secondary text-sm font-semibold no-underline"
              style={{
                height: 44,
                padding: "0 20px",
                background: "rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.3)",
                borderRadius: "var(--radius-md)",
              }}
            >
              📊 View KPI Dashboard
            </Link>
            <Link
              href="/livestock/map"
              className="ew-btn-ghost text-sm font-semibold no-underline text-white hover:text-white"
              style={{
                height: 44,
                padding: "0 16px",
                background: "transparent",
                color: "#FFFFFF",
              }}
            >
              🗺️ Tehsil Map →
            </Link>
          </div>
        </div>
      </section>

      {/* ── High Contrast KPI Cards ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Monitored Districts",
            value: districts.length || 34,
            icon: "📍",
            subtext: "Across 356 Tehsils (MH)",
            accentColor: "#2563eb",
          },
          {
            label: "Active Outbreak Warnings",
            value: summary?.active_alerts ?? alerts.length,
            icon: "🚨",
            subtext: "IDSP & Field Triggered",
            accentColor: "#dc2626",
          },
          {
            label: "MOSPI Disease Models",
            value: "111",
            icon: "🧬",
            subtext: "37 Diseases Projected to 2026",
            accentColor: "#7c3aed",
          },
          {
            label: "Livestock Head Monitored",
            value: "32.5M",
            icon: "🐄",
            subtext: "19th Official Census Census",
            accentColor: "#16a34a",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="ew-stat-card bg-white"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{kpi.icon}</span>
              <span
                className="ew-data-lg font-mono font-bold"
                style={{ color: kpi.accentColor, fontSize: 28 }}
              >
                {kpi.value}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg)" }}>
              {kpi.label}
            </p>
            <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--muted)" }}>
              {kpi.subtext}
            </p>
          </div>
        ))}
      </section>

      {/* ── Quick Access Action Grid (High Contrast Cards) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="ew-eyebrow">Grassroots Workflow Portals</span>
            <h2 className="text-xl font-bold mt-0.5" style={{ color: "var(--fg)" }}>
              Quick Access Hub
            </h2>
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            Select role or module
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="ew-card p-5 no-underline flex flex-col justify-between group transition-all"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="ew-icon-circle"
                    style={{
                      width: 42,
                      height: 42,
                      background: "rgba(79, 110, 247, 0.08)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <span className="text-xl">{link.icon}</span>
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{
                      background: "var(--surface-muted)",
                      color: "var(--accent)",
                      boxShadow: "0 0 0 1px var(--border)",
                    }}
                  >
                    {link.badge}
                  </span>
                </div>

                <h3
                  className="text-base font-bold mb-1 transition-colors group-hover:text-[var(--brand-start)]"
                  style={{ color: "var(--fg)" }}
                >
                  {link.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--fg-2)" }}>
                  {link.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                  Open Module
                </span>
                <span
                  className="text-sm transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--accent)" }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Outbreak Alerts Section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="ew-eyebrow">Surveillance Telemetry</span>
            <h2 className="text-xl font-bold mt-0.5" style={{ color: "var(--fg)" }}>
              Recent Field Alerts
            </h2>
          </div>
          <Link
            href="/livestock/alerts"
            className="ew-btn-compact text-xs no-underline font-semibold"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            View All Alerts →
          </Link>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 && !loading && (
            <div
              className="ew-card p-6 text-center"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              }}
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-lg font-bold">
                ✓
              </div>
              <h4 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                All Districts Operational
              </h4>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                No emergency livestock outbreaks reported in the last 48 hours.
              </p>
            </div>
          )}

          {alerts.map((alert) => {
            const badge = SEVERITY_BADGES[alert.severity] || SEVERITY_BADGES.warning;
            return (
              <div
                key={alert.alert_id}
                className="ew-card p-4 flex items-start gap-4 transition-all"
                style={{
                  background: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
                  borderLeft: `4px solid ${badge.text}`,
                }}
              >
                <span className="text-xl mt-0.5">
                  {alert.severity === "outbreak" || alert.severity === "emergency" ? "🚨" : "⚠️"}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>
                      {alert.district_id}
                    </span>
                    {alert.disease && (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        • {alert.disease}
                      </span>
                    )}
                    <span className="text-xs font-mono ml-auto" style={{ color: "var(--meta)" }}>
                      {new Date(alert.triggered_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--fg)" }}>
                    {alert.message_en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Maharashtra Districts Overview (356 Tehsils Grid) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="ew-eyebrow">19th Livestock Census Breakdown</span>
            <h2 className="text-xl font-bold mt-0.5" style={{ color: "var(--fg)" }}>
              Maharashtra High-Density Livestock Districts
            </h2>
          </div>
          <span className="text-xs font-semibold font-mono" style={{ color: "var(--accent)" }}>
            {districts.length || 34} Districts Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {districts.slice(0, 9).map((d) => (
            <div
              key={d.id}
              className="ew-card p-4"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100">
                <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                  {d.name}
                </h3>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded font-mono"
                  style={{
                    background: "var(--surface-muted)",
                    color: "var(--fg-2)",
                    boxShadow: "0 0 0 1px var(--border)",
                  }}
                >
                  {d.division || "Maharashtra"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs py-1">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500">Cattle</span>
                  <span className="font-mono font-bold" style={{ color: "var(--fg)" }}>
                    {(d.cattle_population / 1000).toFixed(0)}K
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500">Buffalo</span>
                  <span className="font-mono font-bold" style={{ color: "var(--fg)" }}>
                    {(d.buffalo_population / 1000).toFixed(0)}K
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500">Goat/Sheep</span>
                  <span className="font-mono font-bold" style={{ color: "var(--fg)" }}>
                    {(d.goat_population / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Total Livestock
                </span>
                <span className="font-mono font-bold text-xs" style={{ color: "var(--accent)" }}>
                  {((d.total_livestock || 0) / 1000).toFixed(0)}K Animals
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Official Footer ── */}
      <footer
        className="pt-6 border-t border-gray-200 text-center space-y-1.5"
      >
        <p className="text-xs font-semibold" style={{ color: "var(--fg-2)" }}>
          PashuRaksha — Rural Animal Health Surveillance &amp; Livelihood Protection Platform
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Dept. of Animal Husbandry, Dairy Development &amp; Fisheries, Govt. of Maharashtra
        </p>
        <p className="text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>
          Helpline: 1800-233-0418 • Powered by EpiWatch One-Health Engine
        </p>
      </footer>
    </div>
  );
}
