"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAnimalProfile, AnimalProfile } from "@/lib/livestock-api";
import Link from "next/link";

const SPECIES_ICONS: Record<string, string> = {
  cattle: "🐄",
  buffalo: "🐃",
  goat: "🐐",
  sheep: "🐑",
  poultry: "🐔",
};

export default function AnimalDetailPage() {
  const params = useParams();
  const animalId = params.id as string;
  const [profile, setProfile] = useState<AnimalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (animalId) {
      fetchAnimalProfile(animalId)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [animalId]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-12 text-center" style={{ color: "var(--muted)" }}>
        Loading animal profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 md:px-8 py-12 text-center space-y-4">
        <p className="text-lg font-bold" style={{ color: "var(--fg)" }}>
          Animal Record Not Found
        </p>
        <Link
          href="/livestock/animals"
          className="ew-btn-primary text-xs no-underline"
          style={{ height: 40, borderRadius: "var(--radius-md)" }}
        >
          ← Back to Registry
        </Link>
      </div>
    );
  }

  const { animal, vaccinations, treatments, lab_samples } = profile;

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto space-y-6">
      <Link
        href="/livestock/animals"
        className="ew-btn-secondary text-xs no-underline inline-flex items-center gap-2"
        style={{ height: 36, borderRadius: "var(--radius-md)" }}
      >
        ← Back to Registry
      </Link>

      {/* ── Animal Profile Header Card ── */}
      <div
        className="ew-card p-6 bg-white"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
          <span className="text-4xl">{SPECIES_ICONS[animal.species] || "🐾"}</span>
          <div>
            <h1 className="text-2xl font-bold font-mono" style={{ color: "var(--fg)" }}>
              {animal.ear_tag || animal.animal_id}
            </h1>
            <p className="text-sm font-medium capitalize" style={{ color: "var(--muted)" }}>
              {animal.species} • {animal.breed || "Crossbreed"} • {animal.sex || "Female"}
            </p>
          </div>
          <span
            className="ml-auto text-xs font-mono font-bold px-3 py-1 rounded"
            style={{
              background: animal.is_active ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
              color: animal.is_active ? "var(--success)" : "var(--danger)",
            }}
          >
            {animal.is_active ? "ACTIVE HERD" : "INACTIVE"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Age
            </span>
            <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--fg)" }}>
              {animal.age_months ? `${Math.floor(animal.age_months / 12)}y ${animal.age_months % 12}m` : "Adult"}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Owner
            </span>
            <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--fg)" }}>
              {animal.owner_name || "Village Collective"}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Location
            </span>
            <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--fg)" }}>
              {animal.village || ""}{animal.block ? `, ${animal.block}` : ""}, {animal.district_id}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Registration
            </span>
            <p className="font-semibold text-sm mt-0.5 font-mono" style={{ color: "var(--fg)" }}>
              {new Date(animal.registered_at).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Timeline: Vaccinations ── */}
      <div
        className="ew-card p-6 bg-white"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
            💉 Vaccination History
          </h2>
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 rounded"
            style={{ background: "rgba(22, 163, 74, 0.1)", color: "var(--success)" }}
          >
            {vaccinations.length} Recorded
          </span>
        </div>

        {vaccinations.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: "var(--muted)" }}>
            No vaccination records found for this animal.
          </p>
        ) : (
          <div className="space-y-3">
            {vaccinations.map((v, i) => (
              <div
                key={i}
                className="p-3 rounded-lg flex items-start justify-between gap-4"
                style={{ background: "var(--surface-muted)", boxShadow: "var(--shadow-border)" }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                    {v.vaccine_name}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: "var(--fg-2)" }}>
                    <span>🎯 Target: {v.disease_target}</span>
                    {v.batch_number && <span>📦 Batch: {v.batch_number}</span>}
                    {v.administered_by && <span>👨‍⚕️ Vet: {v.administered_by}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--muted)" }}>
                    {v.administered_at ? new Date(v.administered_at).toLocaleDateString("en-IN") : "—"}
                  </span>
                  {v.next_due && (
                    <span className="block text-[11px] font-bold text-amber-700 mt-0.5">
                      ⏰ Due: {new Date(v.next_due).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Timeline: Treatments ── */}
      <div
        className="ew-card p-6 bg-white"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
            💊 Treatment &amp; Clinical Interventions
          </h2>
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 rounded"
            style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}
          >
            {treatments.length} Recorded
          </span>
        </div>

        {treatments.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: "var(--muted)" }}>
            No medical treatments recorded.
          </p>
        ) : (
          <div className="space-y-3">
            {treatments.map((tr, i) => (
              <div
                key={i}
                className="p-3 rounded-lg flex items-start justify-between gap-4"
                style={{ background: "var(--surface-muted)", boxShadow: "var(--shadow-border)" }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                    {tr.diagnosis}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: "var(--fg-2)" }}>
                    {tr.outcome && <span>Outcome: {tr.outcome}</span>}
                    {tr.treated_by && <span>Attending: {tr.treated_by}</span>}
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {tr.treated_at ? new Date(tr.treated_at).toLocaleDateString("en-IN") : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Lab Diagnostic Samples ── */}
      <div
        className="ew-card p-6 bg-white"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
            🔬 Laboratory Diagnostic Referrals
          </h2>
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 rounded"
            style={{ background: "rgba(14, 165, 233, 0.1)", color: "#0284c7" }}
          >
            {lab_samples.length} Samples
          </span>
        </div>

        {lab_samples.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: "var(--muted)" }}>
            No laboratory sample specimens collected.
          </p>
        ) : (
          <div className="space-y-3">
            {lab_samples.map((s, i) => (
              <div
                key={i}
                className="p-3 rounded-lg flex items-center justify-between gap-4"
                style={{ background: "var(--surface-muted)", boxShadow: "var(--shadow-border)" }}
              >
                <div>
                  <p className="text-xs font-mono font-bold" style={{ color: "var(--accent)" }}>
                    {s.sample_id}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--fg)" }}>
                    {s.sample_type} • Status: {s.status.toUpperCase()}
                  </p>
                </div>
                {s.result && (
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-1 rounded"
                    style={{
                      background: s.result === "positive" ? "rgba(220, 38, 38, 0.1)" : "rgba(22, 163, 74, 0.1)",
                      color: s.result === "positive" ? "var(--danger)" : "var(--success)",
                    }}
                  >
                    {s.result.toUpperCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
