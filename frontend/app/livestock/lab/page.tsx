"use client";

import { useEffect, useState } from "react";
import { fetchLabSamples, fetchLabPipelineStats, LabSampleRecord, PipelineStats } from "@/lib/livestock-api";

const STATUS_ORDER = ["collected", "in_transit", "received", "testing", "result_available"];
const STATUS_LABELS: Record<string, string> = {
  collected: "Collected", in_transit: "In Transit", received: "Received at Lab",
  testing: "Under Testing", result_available: "Result Available",
};
const STATUS_COLORS: Record<string, string> = {
  collected: "#eab308", in_transit: "#f97316", received: "#22d3ee",
  testing: "#a855f7", result_available: "#22c55e",
};

export default function LabPage() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [samples, setSamples] = useState<LabSampleRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchLabPipelineStats(),
      fetchLabSamples({ status: statusFilter || undefined }),
    ])
      .then(([s, smp]) => {
        setStats(s);
        setSamples(smp);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#d4af37" }}>🔬 Lab Referral</h1>
      <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Sample collection, tracking &amp; lab results — Maharashtra
      </p>

      {/* ── Pipeline Visualization ────────────────── */}
      <div className="rounded-xl p-6 mb-8" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Sample Pipeline</h2>
        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUS_ORDER.map((status, i) => {
            const count = stats ? (Number(stats[status]) || 0) : 0;
            return (
              <div key={status} className="flex items-center">
                <button
                  onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                  className="flex flex-col items-center px-4 py-3 rounded-xl min-w-[100px] transition-all"
                  style={{
                    background: statusFilter === status
                      ? `${STATUS_COLORS[status]}20`
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${statusFilter === status ? STATUS_COLORS[status] : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <span className="text-2xl font-bold" style={{ color: STATUS_COLORS[status] }}>{count}</span>
                  <span className="text-[10px] mt-1 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {STATUS_LABELS[status]}
                  </span>
                </button>
                {i < STATUS_ORDER.length - 1 && (
                  <span className="mx-1 text-lg" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                )}
              </div>
            );
          })}
        </div>
        {stats && (
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            Total samples: {stats.total}
          </p>
        )}
      </div>

      {/* ── Sample List ──────────────────────────── */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>Loading samples...</div>
        )}
        {!loading && samples.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>No samples found</p>
          </div>
        )}
        {samples.map((s) => (
          <div key={s.sample_id} className="rounded-xl p-4 flex items-center gap-4" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.status] || "#888" }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono" style={{ color: "#22d3ee" }}>{s.sample_id}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{
                  background: `${STATUS_COLORS[s.status]}15`,
                  color: STATUS_COLORS[s.status],
                }}>
                  {STATUS_LABELS[s.status] || s.status}
                </span>
              </div>
              <div className="flex gap-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span>🧪 {s.sample_type}</span>
                {s.suspected_disease && <span>🦠 {s.suspected_disease}</span>}
                <span>📅 {s.collection_date ? new Date(s.collection_date).toLocaleDateString("en-IN") : "—"}</span>
              </div>
            </div>
            {s.result && (
              <span className="text-xs px-3 py-1 rounded-lg font-semibold" style={{
                background: s.result === "positive" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                color: s.result === "positive" ? "#ef4444" : "#22c55e",
              }}>
                {s.result.toUpperCase()}
                {s.pathogen_identified && ` — ${s.pathogen_identified}`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
