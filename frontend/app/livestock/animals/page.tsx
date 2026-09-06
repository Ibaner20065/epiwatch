"use client";

import { useEffect, useState } from "react";
import {
  fetchAnimals,
  fetchLivestockDistricts,
  AnimalRecord,
  LivestockDistrict,
} from "@/lib/livestock-api";
import Link from "next/link";

const SPECIES_ICONS: Record<string, string> = {
  cattle: "🐄",
  buffalo: "🐃",
  goat: "🐐",
  sheep: "🐑",
  poultry: "🐔",
};

export default function AnimalsPage() {
  const [districts, setDistricts] = useState<LivestockDistrict[]>([]);
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [filter, setFilter] = useState({ district_id: "", species: "", ear_tag: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLivestockDistricts().then(setDistricts).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAnimals({
      district_id: filter.district_id || undefined,
      species: filter.species || undefined,
      ear_tag: filter.ear_tag || undefined,
      limit: 100,
    })
      .then(setAnimals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter.district_id, filter.species]);

  const handleSearch = () => {
    setLoading(true);
    fetchAnimals({
      district_id: filter.district_id || undefined,
      species: filter.species || undefined,
      ear_tag: filter.ear_tag || undefined,
      limit: 100,
    })
      .then(setAnimals)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
          🐄 Smallholder Animal Registry (Herd EHR)
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Ear-tag census tracking, vaccination history &amp; veterinary diagnostic records — Maharashtra
        </p>
      </div>

      {/* ── High Contrast Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter.district_id}
          onChange={(e) => setFilter({ ...filter, district_id: e.target.value })}
          className="ew-select text-xs font-semibold"
          style={{ width: "auto", minWidth: 160 }}
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={filter.species}
          onChange={(e) => setFilter({ ...filter, species: e.target.value })}
          className="ew-select text-xs font-semibold"
          style={{ width: "auto", minWidth: 150 }}
        >
          <option value="">All Species</option>
          <option value="cattle">🐄 Cattle</option>
          <option value="buffalo">🐃 Buffalo</option>
          <option value="goat">🐐 Goat</option>
          <option value="sheep">🐑 Sheep</option>
          <option value="poultry">🐔 Poultry</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filter.ear_tag}
            onChange={(e) => setFilter({ ...filter, ear_tag: e.target.value })}
            placeholder="Search ear tag ID..."
            className="ew-input text-xs w-48"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="ew-btn-primary text-xs"
            style={{ height: 40, padding: "0 14px", borderRadius: "var(--radius-md)" }}
          >
            Search
          </button>
        </div>

        <span className="text-xs font-mono font-semibold" style={{ color: "var(--muted)" }}>
          {animals.length} animal{animals.length !== 1 ? "s" : ""} registered
        </span>
      </div>

      {/* ── Animal Cards Grid (Pure White, Crisp Contrast) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-full space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="t-skeleton-reveal h-32 w-full" />
            ))}
          </div>
        )}

        {!loading && animals.length === 0 && (
          <div
            className="col-span-full ew-card p-8 text-center bg-white"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <p className="text-2xl mb-1">🐄</p>
            <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
              No Animals Found
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Try adjusting the district, species, or ear-tag filter.
            </p>
          </div>
        )}

        {animals.map((animal) => (
          <Link
            key={animal.animal_id}
            href={`/livestock/animals/${animal.animal_id}`}
            className="ew-card p-5 no-underline flex flex-col justify-between bg-white group transition-all"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div>
              <div className="flex items-start justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{SPECIES_ICONS[animal.species] || "🐾"}</span>
                  <div>
                    <p className="text-sm font-mono font-bold" style={{ color: "var(--accent)" }}>
                      {animal.ear_tag || animal.animal_id}
                    </p>
                    <p className="text-xs font-semibold capitalize" style={{ color: "var(--fg)" }}>
                      {animal.species} {animal.breed ? `• ${animal.breed}` : ""}
                    </p>
                  </div>
                </div>

                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                  style={{
                    background: animal.is_active ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
                    color: animal.is_active ? "var(--success)" : "var(--danger)",
                  }}
                >
                  {animal.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="space-y-1 text-xs" style={{ color: "var(--fg-2)" }}>
                <p>
                  <strong style={{ color: "var(--fg)" }}>Owner:</strong>{" "}
                  {animal.owner_name || "Gram Panchayat Registry"}
                </p>
                <p>
                  <strong style={{ color: "var(--fg)" }}>Village:</strong>{" "}
                  {animal.village || "Local Tehsil"}
                  {animal.block ? `, ${animal.block}` : ""}, {animal.district_id}
                </p>
                <p>
                  <strong style={{ color: "var(--fg)" }}>Age / Sex:</strong>{" "}
                  {animal.age_months ? `${animal.age_months} mo` : "Adult"} • {animal.sex || "Female"}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
              <span style={{ color: "var(--accent)" }}>View Health Record</span>
              <span
                className="transition-transform group-hover:translate-x-1"
                style={{ color: "var(--accent)" }}
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
