"use client";

import { useEffect, useState } from "react";
import { fetchAlerts, acknowledgeAlert, LivestockAlert } from "@/lib/livestock-api";
import MorphIcon from "@/app/components/MorphIcon";

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  watch: { bg: "rgba(22, 163, 74, 0.08)", text: "#15803d", border: "#16a34a" },
  warning: { bg: "rgba(217, 119, 6, 0.08)", text: "#b45309", border: "#eab308" },
  outbreak: { bg: "rgba(220, 38, 38, 0.08)", text: "#b91c1c", border: "#dc2626" },
  emergency: { bg: "rgba(185, 28, 28, 0.12)", text: "#991b1b", border: "#b91c1c" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<LivestockAlert[]>([]);
  const [filter, setFilter] = useState<{ severity: string; status: string }>({
    severity: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);

  const loadAlerts = () => {
    setLoading(true);
    fetchAlerts({
      severity: filter.severity || undefined,
      status: filter.status || undefined,
    })
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, [filter.severity, filter.status]);

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId, "DVO-Maharashtra");
    loadAlerts();
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1200px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
          🚨 Outbreak Early Warning Alerts
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Auto-generated livestock disease surveillance alerts &amp; veterinary officer escalation
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter.severity}
          onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
          className="ew-select text-xs font-semibold"
          style={{ width: "auto", minWidth: 150 }}
        >
          <option value="">All Severities</option>
          <option value="watch">🟢 Watch</option>
          <option value="warning">🟡 Warning</option>
          <option value="outbreak">🔴 Outbreak</option>
          <option value="emergency">⚫ Emergency</option>
        </select>

        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="ew-select text-xs font-semibold"
          style={{ width: "auto", minWidth: 150 }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active Alerts</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>

        <span className="text-xs font-mono font-semibold" style={{ color: "var(--muted)" }}>
          {alerts.length} alert{alerts.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* ── Alert Cards List ── */}
      <div className="space-y-3.5">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="t-skeleton-reveal h-20 w-full" />
            ))}
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div
            className="ew-card p-8 text-center bg-white"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <p className="text-2xl mb-1">✅</p>
            <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
              No Active Alerts Match Criteria
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              All district veterinary parameters within normal limits.
            </p>
          </div>
        )}

        {alerts.map((alert) => {
          const styleInfo = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.watch;
          return (
            <div
              key={alert.alert_id}
              className="ew-card p-5 bg-white flex flex-col sm:flex-row items-start justify-between gap-4 transition-all"
              style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
                borderLeft: `4px solid ${styleInfo.border}`,
              }}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: styleInfo.bg, color: styleInfo.text }}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                  <span
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                    style={{
                      background: alert.status === "active" ? "rgba(220, 38, 38, 0.1)" : "rgba(22, 163, 74, 0.1)",
                      color: alert.status === "active" ? "var(--danger)" : "var(--success)",
                    }}
                  >
                    {alert.status.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{alert.alert_id}</span>
                  <span className="text-xs font-mono text-gray-500 ml-auto">
                    {new Date(alert.triggered_at).toLocaleString("en-IN")}
                  </span>
                </div>

                <p className="text-sm font-semibold leading-normal" style={{ color: "var(--fg)" }}>
                  {alert.message_en}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--fg-2)" }}>
                  <span className="font-semibold">
                    📍 {alert.district_id}
                    {alert.block ? ` / ${alert.block}` : ""}
                    {alert.village ? ` / ${alert.village}` : ""}
                  </span>
                  {alert.disease && <span>• 🦠 {alert.disease}</span>}
                  {alert.species && <span>• 🐾 {alert.species}</span>}
                </div>

                {alert.acknowledged_by && (
                  <p className="text-xs font-medium pt-1 text-emerald-700">
                    ✓ Acknowledged by {alert.acknowledged_by} at{" "}
                    {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleTimeString("en-IN") : ""}
                  </p>
                )}
              </div>

              {alert.status === "active" && (
                <button
                  onClick={() => handleAcknowledge(alert.alert_id)}
                  className="ew-btn-secondary text-xs shrink-0"
                  style={{
                    height: 36,
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <MorphIcon state="bell" size={14} color="var(--fg)" />
                  <span>Acknowledge</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
