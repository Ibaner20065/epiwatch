"use client";

import { useEffect, useState } from "react";
import { fetchAnimals, fetchLivestockDistricts, AnimalRecord, LivestockDistrict } from "@/lib/livestock-api";
import Link from "next/link";

const SPECIES_ICONS: Record<string, string> = {
  cattle: "🐄", buffalo: "🐃", goat: "🐐", sheep: "🐑", poultry: "🐔",
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
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#d4af37" }}>🐄 Animal Registry</h1>
      <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Search and manage animal health records — Maharashtra
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filter.district_id}
          onChange={(e) => setFilter({ ...filter, district_id: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={filter.species}
          onChange={(e) => setFilter({ ...filter, species: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <option value="">All Species</option>
          <option value="cattle">🐄 Cattle</option>
          <option value="buffalo">🐃 Buffalo</option>
          <option value="goat">🐐 Goat</option>
          <option value="sheep">🐑 Sheep</option>
          <option value="poultry">🐔 Poultry</option>
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            value={filter.ear_tag}
            onChange={(e) => setFilter({ ...filter, ear_tag: e.target.value })}
            placeholder="Search ear tag..."
            className="px-3 py-2 rounded-lg text-sm w-40"
            style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)" }}
          >
            🔍
          </button>
        </div>
        <span className="flex items-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {animals.length} animal{animals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Animal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-full text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>
            Loading...
          </div>
        )}
        {!loading && animals.length === 0 && (
          <div className="col-span-full rounded-xl p-8 text-center" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>No animals found</p>
          </div>
        )}
        {animals.map((animal) => (
          <Link
            key={animal.animal_id}
            href={`/livestock/animals/${animal.animal_id}`}
            className="rounded-xl p-5 no-underline transition-all group"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{SPECIES_ICONS[animal.species] || "🐾"}</span>
                <div>
                  <p className="text-xs font-mono" style={{ color: "#d4af37" }}>{animal.ear_tag || animal.animal_id}</p>
                  <p className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {animal.species} • {animal.breed || "—"}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{
                background: animal.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: animal.is_active ? "#22c55e" : "#ef4444",
              }}>
                {animal.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="space-y-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <p>👤 {animal.owner_name || "Unknown owner"}</p>
              <p>📍 {animal.village || ""}{animal.block ? `, ${animal.block}` : ""}, {animal.district_id}</p>
              <p>🎂 {animal.age_months ? `${animal.age_months} months` : "—"} • {animal.sex || "—"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
