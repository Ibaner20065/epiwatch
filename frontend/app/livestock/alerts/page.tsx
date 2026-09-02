"use client";

import { useEffect, useState } from "react";
import { fetchAlerts, acknowledgeAlert, LivestockAlert } from "@/lib/livestock-api";

const SEVERITY_COLORS: Record<string, string> = {
  watch: "#22c55e", warning: "#eab308", outbreak: "#ef4444", emergency: "#dc2626",
};
const SEVERITY_BG: Record<string, string> = {
  watch: "rgba(34,197,94,0.1)", warning: "rgba(234,179,8,0.1)",
  outbreak: "rgba(239,68,68,0.1)", emergency: "rgba(220,38,38,0.15)",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<LivestockAlert[]>([]);
  const [filter, setFilter] = useState<{ severity: string; status: string }>({ severity: "", status: "" });
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

  useEffect(() => { loadAlerts(); }, [filter.severity, filter.status]);

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId, "DVO-Maharashtra");
    loadAlerts();
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#d4af37" }}>🚨 Alerts</h1>
      <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Auto-generated disease surveillance alerts — Maharashtra
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filter.severity}
          onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
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
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <span className="flex items-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>Loading alerts...</div>
        )}
        {!loading && alerts.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{
            background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)",
          }}>
            <p className="text-lg mb-1">✅</p>
            <p className="text-sm" style={{ color: "#22c55e" }}>No alerts matching filters</p>
          </div>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.alert_id}
            className="rounded-xl p-5 transition-all"
            style={{
              background: SEVERITY_BG[alert.severity] || "rgba(255,255,255,0.03)",
              borderLeft: `4px solid ${SEVERITY_COLORS[alert.severity] || "#888"}`,
              border: `1px solid ${SEVERITY_COLORS[alert.severity]}30`,
              borderLeftWidth: "4px",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded font-bold" style={{
                    background: `${SEVERITY_COLORS[alert.severity]}20`,
                    color: SEVERITY_COLORS[alert.severity],
                  }}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{
                    background: alert.status === "active" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                    color: alert.status === "active" ? "#ef4444" : "#22c55e",
                  }}>
                    {alert.status}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {alert.alert_id}
                  </span>
                </div>

                <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {alert.message_en}
                </p>

                <div className="flex flex-wrap gap-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span>📍 {alert.district_id}{alert.block ? ` / ${alert.block}` : ""}{alert.village ? ` / ${alert.village}` : ""}</span>
                  {alert.disease && <span>🦠 {alert.disease}</span>}
                  {alert.species && <span>🐾 {alert.species}</span>}
                  <span>⏰ {new Date(alert.triggered_at).toLocaleString("en-IN")}</span>
                </div>

                {alert.acknowledged_by && (
                  <p className="text-xs mt-2" style={{ color: "#22c55e" }}>
                    ✓ Acknowledged by {alert.acknowledged_by} at {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleString("en-IN") : ""}
                  </p>
                )}
              </div>

              {alert.status === "active" && (
                <button
                  onClick={() => handleAcknowledge(alert.alert_id)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                  style={{
                    background: "rgba(212,175,55,0.15)",
                    color: "#d4af37",
                    border: "1px solid rgba(212,175,55,0.3)",
                  }}
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
