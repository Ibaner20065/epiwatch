"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAnimalProfile, AnimalProfile } from "@/lib/livestock-api";
import Link from "next/link";

const SPECIES_ICONS: Record<string, string> = {
  cattle: "🐄", buffalo: "🐃", goat: "🐐", sheep: "🐑", poultry: "🐔",
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
      <div className="px-4 md:px-8 py-12 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
        Loading animal profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 md:px-8 py-12 text-center">
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Animal not found</p>
        <Link href="/livestock/animals" className="text-sm mt-4 inline-block" style={{ color: "#d4af37" }}>
          ← Back to registry
        </Link>
      </div>
    );
  }

  const { animal, vaccinations, treatments, lab_samples } = profile;

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <Link href="/livestock/animals" className="text-xs no-underline mb-4 inline-block" style={{ color: "#d4af37" }}>
        ← Back to Registry
      </Link>

      {/* ── Animal Header ─────────────────────────── */}
      <div className="rounded-xl p-6 mb-6" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.2)",
      }}>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{SPECIES_ICONS[animal.species] || "🐾"}</span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#d4af37" }}>
              {animal.ear_tag || animal.animal_id}
            </h1>
            <p className="text-sm capitalize" style={{ color: "rgba(255,255,255,0.5)" }}>
              {animal.species} • {animal.breed || "Unknown breed"} • {animal.sex || "—"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          <div>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Age</span>
            <p className="font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              {animal.age_months ? `${Math.floor(animal.age_months / 12)}y ${animal.age_months % 12}m` : "—"}
            </p>
          </div>
          <div>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Owner</span>
            <p className="font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{animal.owner_name || "—"}</p>
          </div>
          <div>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Location</span>
            <p className="font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              {animal.village || ""}{animal.block ? `, ${animal.block}` : ""}, {animal.district_id}
            </p>
          </div>
          <div>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Status</span>
            <p className="font-medium" style={{ color: animal.is_active ? "#22c55e" : "#ef4444" }}>
              {animal.is_active ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Timeline: Vaccinations ────────────────── */}
      <div className="rounded-xl p-6 mb-6" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
          💉 Vaccination History
          <span className="text-xs font-normal px-2 py-0.5 rounded" style={{
            background: "rgba(34,197,94,0.1)", color: "#22c55e",
          }}>{vaccinations.length}</span>
        </h2>
        {vaccinations.length === 0 ? (
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No vaccination records</p>
        ) : (
          <div className="space-y-3">
            {vaccinations.map((v, i) => (
              <div key={i} className="flex items-start gap-3 pl-4" style={{ borderLeft: "2px solid rgba(34,197,94,0.3)" }}>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {v.vaccine_name}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span>🎯 {v.disease_target}</span>
                    {v.batch_number && <span>📦 {v.batch_number}</span>}
                    {v.administered_by && <span>👨‍⚕️ {v.administered_by}</span>}
                    <span>📅 {v.administered_at ? new Date(v.administered_at).toLocaleDateString("en-IN") : "—"}</span>
                  </div>
                  {v.next_due && (
                    <p className="text-xs mt-1" style={{ color: "#eab308" }}>
                      ⏰ Next due: {new Date(v.next_due).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Timeline: Treatments ──────────────────── */}
      <div className="rounded-xl p-6 mb-6" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
          💊 Treatment History
          <span className="text-xs font-normal px-2 py-0.5 rounded" style={{
            background: "rgba(168,85,247,0.1)", color: "#a855f7",
          }}>{treatments.length}</span>
        </h2>
        {treatments.length === 0 ? (
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No treatment records</p>
        ) : (
          <div className="space-y-3">
            {treatments.map((tr, i) => (
              <div key={i} className="flex items-start gap-3 pl-4" style={{ borderLeft: "2px solid rgba(168,85,247,0.3)" }}>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{tr.diagnosis}</p>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {tr.outcome && <span>📊 {tr.outcome}</span>}
                    {tr.treated_by && <span>👨‍⚕️ {tr.treated_by}</span>}
                    <span>📅 {tr.treated_at ? new Date(tr.treated_at).toLocaleDateString("en-IN") : "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Lab Samples ──────────────────────────── */}
      <div className="rounded-xl p-6" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
          🔬 Lab Samples
          <span className="text-xs font-normal px-2 py-0.5 rounded" style={{
            background: "rgba(34,211,238,0.1)", color: "#22d3ee",
          }}>{lab_samples.length}</span>
        </h2>
        {lab_samples.length === 0 ? (
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No lab samples</p>
        ) : (
          <div className="space-y-3">
            {lab_samples.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{
                background: "rgba(255,255,255,0.03)",
              }}>
                <div className="flex-1">
                  <p className="text-xs font-mono" style={{ color: "#22d3ee" }}>{s.sample_id}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {s.sample_type} • {s.status}
                  </p>
                </div>
                {s.result && (
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: s.result === "positive" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                    color: s.result === "positive" ? "#ef4444" : "#22c55e",
                  }}>
                    {s.result}
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
