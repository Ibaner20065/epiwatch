"use client";

import React, { useEffect, useState } from "react";
import RiskBadge from "@/app/components/RiskBadge";
import MorphIcon from "@/app/components/MorphIcon";

export interface OutbreakAlert {
  id: string;
  timestamp: string;
  district_name: string;
  state: string;
  disease: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  headline: string;
  trigger_source: string;
  details: string;
  acknowledged?: boolean;
}

export default function AlertFeed() {
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [activeModalAlert, setActiveModalAlert] = useState<OutbreakAlert | null>(null);

  useEffect(() => {
    // Grounded alerts based on current predictions and IDSP bulletins
    setAlerts([
      {
        id: "alt-01",
        timestamp: "2026-08-09 (Latest Bulletin)",
        district_name: "Pune",
        state: "Maharashtra",
        disease: "Dengue",
        severity: "Critical",
        headline: "Rainfall lag surge triggers 6.5-week vector outbreak warning",
        trigger_source: "IDSP Surveillance DB + NASA POWER",
        details:
          "Precipitation accumulated over prior 14 days exceeds 85mm threshold. Vector mosquito breeding density elevated across peri-urban wards. Rapid diagnostic kits deployment advised.",
        acknowledged: false,
      },
      {
        id: "alt-02",
        timestamp: "2026-08-08",
        district_name: "Kolkata",
        state: "West Bengal",
        disease: "Dengue",
        severity: "High",
        headline: "Monsoon humidity threshold breached with temperature > 31°C",
        trigger_source: "Open-Meteo Satellite Feed",
        details:
          "High relative humidity (82%) combined with urban surface runoff indicates elevated arboviral transmission risk. Municipal vector control alerted.",
        acknowledged: false,
      },
      {
        id: "alt-03",
        timestamp: "2026-08-07",
        district_name: "Bengaluru Urban",
        state: "Karnataka",
        disease: "ADD",
        headline: "Waterborne Enteric Case Cluster detected in Peri-Urban Wards",
        severity: "Medium",
        trigger_source: "IDSP Weekly Surveillance",
        details:
          "Acute diarrheal disease symptoms reported in post-rain drainage zones. Purification kit pre-positioning recommended at local taluka PHCs.",
        acknowledged: false,
      },
    ]);
  }, []);

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  const toggleAcknowledge = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: !a.acknowledged } : a))
    );
  };

  return (
    <div className="ew-card p-6">
      {/* ── Alert Feed Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold" style={{ color: "var(--fg)" }}>
              Surveillance Alert Feed
            </h3>
            {unacknowledgedCount > 0 && (
              <span
                className="t-notification-badge px-2 py-0.5 text-[11px] font-bold rounded-full"
                style={{
                  background: "rgba(220, 38, 38, 0.12)",
                  color: "var(--danger)",
                }}
              >
                {unacknowledgedCount} New
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Real-time triggers from NASA POWER climate lags and IDSP surveillance
          </p>
        </div>

        <span
          className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full"
          style={{
            background: "rgba(79, 110, 247, 0.08)",
            color: "var(--accent)",
          }}
        >
          <span className="ew-live-dot" style={{ width: 6, height: 6 }} />
          Live Stream
        </span>
      </div>

      {/* ── Alert List ── */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => setActiveModalAlert(alert)}
            className="p-4 rounded-lg cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{
              background: alert.acknowledged ? "var(--surface-muted)" : "var(--surface)",
              boxShadow: "var(--shadow-border)",
              opacity: alert.acknowledged ? 0.75 : 1,
            }}
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="ew-data-sm font-medium" style={{ color: "var(--accent)" }}>
                  {alert.timestamp}
                </span>
                <span style={{ color: "var(--border)" }}>•</span>
                <span className="font-semibold" style={{ color: "var(--fg)" }}>
                  {alert.district_name}, {alert.state}
                </span>
                <span style={{ color: "var(--border)" }}>•</span>
                <span className="ew-eyebrow">{alert.disease}</span>
                {alert.acknowledged && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">
                    Acknowledged
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                {alert.headline}
              </h4>
              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
                {alert.details}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right text-xs hidden sm:block">
                <span className="block ew-eyebrow" style={{ fontSize: 10 }}>
                  Trigger Source
                </span>
                <span className="ew-data-sm">{alert.trigger_source}</span>
              </div>

              <RiskBadge tier={alert.severity} size="sm" />

              {/* FR-4 Alert Acknowledgment with MorphIcon (bell ↔ check) & Rectangular Button */}
              <button
                type="button"
                onClick={(e) => toggleAcknowledge(alert.id, e)}
                title={alert.acknowledged ? "Mark unacknowledged" : "Acknowledge alert"}
                className={`ew-btn-compact ${
                  alert.acknowledged ? "text-green-700" : "text-gray-700 hover:text-blue-600"
                }`}
                style={{
                  height: 34,
                  padding: "0 10px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <MorphIcon
                  state={alert.acknowledged ? "check" : "bell"}
                  size={15}
                  color={alert.acknowledged ? "var(--success)" : "var(--fg-2)"}
                />
                <span className="text-xs font-medium">
                  {alert.acknowledged ? "Acked" : "Ack"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── FR-4 Alert Detail Modal (transitions.dev t-modal) ── */}
      {activeModalAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setActiveModalAlert(null)}
        >
          <div
            className="t-modal ew-card w-full max-w-lg p-6 space-y-4"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <RiskBadge tier={activeModalAlert.severity} size="md" />
                  <span className="ew-eyebrow">{activeModalAlert.disease}</span>
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
                  {activeModalAlert.headline}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalAlert(null)}
                className="ew-btn-compact"
                style={{ height: 32, width: 32, padding: 0 }}
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-md text-xs space-y-1" style={{ background: "var(--surface-muted)" }}>
              <div className="flex justify-between">
                <span className="text-gray-500">Location:</span>
                <span className="font-semibold text-gray-800">
                  {activeModalAlert.district_name}, {activeModalAlert.state}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trigger Timestamp:</span>
                <span className="font-mono text-gray-800">{activeModalAlert.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Surveillance Telemetry:</span>
                <span className="font-mono text-gray-800">{activeModalAlert.trigger_source}</span>
              </div>
            </div>

            <div>
              <h5 className="ew-eyebrow mb-1">Detailed Epidemiological Attribution</h5>
              <p className="text-xs leading-relaxed" style={{ color: "var(--fg-2)" }}>
                {activeModalAlert.details}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={(e) => {
                  toggleAcknowledge(activeModalAlert.id, e);
                  setActiveModalAlert((prev) => (prev ? { ...prev, acknowledged: !prev.acknowledged } : null));
                }}
                className="ew-btn-secondary text-xs"
                style={{ height: 40, borderRadius: "var(--radius-md)" }}
              >
                <MorphIcon
                  state={activeModalAlert.acknowledged ? "check" : "bell"}
                  size={16}
                  color={activeModalAlert.acknowledged ? "var(--success)" : "var(--fg)"}
                />
                {activeModalAlert.acknowledged ? "Mark Unacknowledged" : "Acknowledge Alert (FR-4)"}
              </button>

              <button
                onClick={() => setActiveModalAlert(null)}
                className="ew-btn-primary text-xs"
                style={{ height: 40, borderRadius: "var(--radius-md)" }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
