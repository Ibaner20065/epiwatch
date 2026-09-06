"use client";

import { useEffect, useState } from "react";
import {
  fetchLabSamples,
  fetchLabPipelineStats,
  LabSampleRecord,
  PipelineStats,
} from "@/lib/livestock-api";

const STATUS_ORDER = ["collected", "in_transit", "received", "testing", "result_available"];
const STATUS_LABELS: Record<string, string> = {
  collected: "Collected",
  in_transit: "In Transit",
  received: "Received at Lab",
  testing: "Under Testing",
  result_available: "Result Available",
};

export default function LabPage() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [samples, setSamples] = useState<LabSampleRecord[]>([]);
  const [selectedSample, setSelectedSample] = useState<LabSampleRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSample, setNewSample] = useState({
    district_id: "PUNE",
    species: "cattle",
    sample_type: "Blood / Serum",
    suspected_disease: "Lumpy Skin Disease",
  });

  useEffect(() => {
    Promise.all([
      fetchLabPipelineStats(),
      fetchLabSamples({ status: statusFilter || undefined }),
    ])
      .then(([s, smp]) => {
        setStats(s);
        setSamples(smp);
        if (smp.length > 0 && !selectedSample) {
          setSelectedSample(smp[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const created: LabSampleRecord = {
      sample_id: `MH-VET-${Date.now().toString().slice(-6)}`,
      district_id: newSample.district_id,
      species: newSample.species,
      sample_type: newSample.sample_type,
      suspected_disease: newSample.suspected_disease,
      status: "collected",
      collection_date: new Date().toISOString(),
    };
    setSamples((prev) => [created, ...prev]);
    setSelectedSample(created);
    setShowCreateModal(false);
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1300px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            🔬 Diagnostic Lab Referral &amp; Chain of Custody
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Official cold-chain tracking, taluka sample dispatch &amp; PCR test verification
          </p>
        </div>

        {/* Rectangular Primary Button (8px radius) */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="ew-btn-primary"
          style={{ height: 44, borderRadius: "var(--radius-md)" }}
        >
          <span>+</span>
          <span>Create Lab Referral (FR-8)</span>
        </button>
      </div>

      {/* ── Pipeline Visualization ── */}
      <div className="ew-card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>
          Cold-Chain Pipeline Verification
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_ORDER.map((status, i) => {
            const count = stats ? Number(stats[status]) || 0 : 0;
            const isSelected = statusFilter === status;
            return (
              <div key={status} className="flex items-center">
                <button
                  onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                  className="flex flex-col items-center px-4 py-3 rounded-lg min-w-[120px] transition-all border-none cursor-pointer"
                  style={{
                    background: isSelected ? "rgba(79, 110, 247, 0.08)" : "var(--surface-muted)",
                    boxShadow: isSelected
                      ? "0 0 0 1.5px var(--accent)"
                      : "var(--shadow-border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <span
                    className="text-2xl font-bold font-mono tracking-tight"
                    style={{ color: isSelected ? "var(--accent)" : "var(--fg)" }}
                  >
                    {count}
                  </span>
                  <span
                    className="text-xs mt-1 font-medium whitespace-nowrap"
                    style={{ color: isSelected ? "var(--accent)" : "var(--muted)" }}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </button>
                {i < STATUS_ORDER.length - 1 && (
                  <span className="mx-2 text-sm" style={{ color: "var(--border)" }}>
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Side-by-Side View: Queue ↔ Detail (transitions.dev t-page-side-by-side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sample Queue Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="ew-eyebrow">Sample Queue ({samples.length})</span>
            <span className="ew-data-sm">Showing Active Referrals</span>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="t-skeleton-reveal h-16 w-full" />
              ))}
            </div>
          )}

          {!loading && samples.length === 0 && (
            <div className="ew-card p-8 text-center">
              <p style={{ color: "var(--muted)" }}>No sample records found matching filter.</p>
            </div>
          )}

          <div className="space-y-2.5">
            {samples.map((s) => {
              const isSelected = selectedSample?.sample_id === s.sample_id;
              return (
                <div
                  key={s.sample_id}
                  onClick={() => setSelectedSample(s)}
                  className="ew-card p-4 flex items-center justify-between gap-4 cursor-pointer transition-all"
                  style={{
                    boxShadow: isSelected
                      ? "0 0 0 2px var(--accent), 0 4px 12px rgba(79, 110, 247, 0.12)"
                      : "var(--shadow-border)",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "rgba(79, 110, 247, 0.02)" : "var(--surface)",
                  }}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Geist Mono for Sample IDs */}
                      <span className="font-mono text-xs font-bold" style={{ color: "var(--accent)" }}>
                        {s.sample_id}
                      </span>
                      {/* Geist Mono for Status Codes */}
                      <span
                        className="font-mono text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: "var(--surface-muted)",
                          color: "var(--fg-2)",
                          boxShadow: "var(--shadow-border)",
                        }}
                      >
                        {s.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                      <span>🧪 {s.sample_type}</span>
                      {s.suspected_disease && <span>🦠 {s.suspected_disease}</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className="ew-btn-compact text-xs"
                      style={{ borderRadius: "var(--radius-sm)" }}
                    >
                      Inspect →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sample Detail Column (transitions.dev t-page-side-by-side) */}
        <div className="lg:col-span-5">
          <div className="t-page-side-by-side ew-card p-6 space-y-4 sticky top-24">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="ew-eyebrow">Active Chain of Custody</span>
                <h3 className="text-lg font-bold font-mono mt-0.5" style={{ color: "var(--fg)" }}>
                  {selectedSample ? selectedSample.sample_id : "Select Sample"}
                </h3>
              </div>
              {selectedSample && (
                <span
                  className="font-mono text-xs px-2.5 py-1 rounded font-bold"
                  style={{
                    background:
                      selectedSample.status === "result_available"
                        ? "rgba(22, 163, 74, 0.1)"
                        : "rgba(79, 110, 247, 0.1)",
                    color:
                      selectedSample.status === "result_available"
                        ? "var(--success)"
                        : "var(--accent)",
                  }}
                >
                  {STATUS_LABELS[selectedSample.status] || selectedSample.status}
                </span>
              )}
            </div>

            {selectedSample ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--surface-muted)" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted)" }}>Origin District:</span>
                    <span className="font-semibold" style={{ color: "var(--fg)" }}>
                      {selectedSample.district_id || "Pune"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted)" }}>Species:</span>
                    <span className="font-semibold capitalize" style={{ color: "var(--fg)" }}>
                      {selectedSample.species}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted)" }}>Sample Specimen:</span>
                    <span className="font-semibold" style={{ color: "var(--fg)" }}>
                      {selectedSample.sample_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted)" }}>Suspected Disease:</span>
                    <span className="font-semibold" style={{ color: "var(--accent)" }}>
                      {selectedSample.suspected_disease || "General Surveillance"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted)" }}>Collection Timestamp:</span>
                    <span className="font-mono" style={{ color: "var(--fg-2)" }}>
                      {selectedSample.collection_date
                        ? new Date(selectedSample.collection_date).toLocaleString("en-IN")
                        : "Recent"}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="ew-eyebrow mb-2">5-Stage Cold Chain Progression</h4>
                  <div className="space-y-2">
                    {STATUS_ORDER.map((st, idx) => {
                      const currentIdx = STATUS_ORDER.indexOf(selectedSample.status);
                      const isDone = idx <= currentIdx;
                      return (
                        <div key={st} className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold"
                            style={{
                              background: isDone ? "var(--accent)" : "var(--surface-muted)",
                              color: isDone ? "#fff" : "var(--muted)",
                            }}
                          >
                            {isDone ? "✓" : idx + 1}
                          </span>
                          <span
                            className={isDone ? "font-semibold" : "text-gray-400"}
                            style={{ color: isDone ? "var(--fg)" : "var(--muted)" }}
                          >
                            {STATUS_LABELS[st]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedSample.result && (
                  <div
                    className="p-3 rounded-md"
                    style={{
                      background:
                        selectedSample.result === "positive"
                          ? "rgba(220, 38, 38, 0.08)"
                          : "rgba(22, 163, 74, 0.08)",
                      boxShadow: `0 0 0 1px ${
                        selectedSample.result === "positive" ? "var(--danger)" : "var(--success)"
                      }`,
                    }}
                  >
                    <span className="ew-eyebrow block mb-1">Diagnostic Laboratory Outcome</span>
                    <p
                      className="font-bold text-sm font-mono"
                      style={{
                        color:
                          selectedSample.result === "positive" ? "var(--danger)" : "var(--success)",
                      }}
                    >
                      {selectedSample.result.toUpperCase()}
                      {selectedSample.pathogen_identified && ` — ${selectedSample.pathogen_identified}`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-center py-6" style={{ color: "var(--muted)" }}>
                Select a sample to inspect the chain of custody.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── FR-8 Referral Creation Modal (transitions.dev t-modal) ── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="t-modal ew-card w-full max-w-md p-6 space-y-4"
            style={{ borderRadius: "var(--radius-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold" style={{ color: "var(--fg)" }}>
                Create Lab Referral Form (FR-8)
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="ew-btn-compact"
                style={{ width: 32, height: 32, padding: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                  Target District
                </label>
                <select
                  value={newSample.district_id}
                  onChange={(e) => setNewSample({ ...newSample, district_id: e.target.value })}
                  className="ew-select text-xs"
                >
                  <option value="PUNE">Pune</option>
                  <option value="NASHIK">Nashik</option>
                  <option value="AHMEDNAGAR">Ahmednagar</option>
                  <option value="SATARA">Satara</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                  Species
                </label>
                <select
                  value={newSample.species}
                  onChange={(e) => setNewSample({ ...newSample, species: e.target.value })}
                  className="ew-select text-xs"
                >
                  <option value="cattle">Cattle</option>
                  <option value="buffalo">Buffalo</option>
                  <option value="sheep">Sheep</option>
                  <option value="goat">Goat</option>
                  <option value="poultry">Poultry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                  Specimen Type
                </label>
                <input
                  type="text"
                  value={newSample.sample_type}
                  onChange={(e) => setNewSample({ ...newSample, sample_type: e.target.value })}
                  className="ew-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                  Suspected Pathogen / Disease
                </label>
                <input
                  type="text"
                  value={newSample.suspected_disease}
                  onChange={(e) => setNewSample({ ...newSample, suspected_disease: e.target.value })}
                  className="ew-input text-xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="ew-btn-secondary text-xs"
                  style={{ height: 40, borderRadius: "var(--radius-md)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ew-btn-primary text-xs font-semibold"
                  style={{ height: 40, borderRadius: "var(--radius-md)" }}
                >
                  Dispatch &amp; Generate Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
