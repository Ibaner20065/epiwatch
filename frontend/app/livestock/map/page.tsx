"use client";

import { useEffect, useState } from "react";
import { fetchLivestockDistricts, LivestockDistrict } from "@/lib/livestock-api";

const DISEASE_COLORS: Record<string, string> = {
  fmd: "#ef4444", lsd: "#f97316", ppr: "#eab308", brucellosis: "#a855f7", ai_h5n1: "#22d3ee",
};
const DISEASE_LABELS: Record<string, string> = {
  fmd: "FMD", lsd: "LSD", ppr: "PPR", brucellosis: "Brucellosis", ai_h5n1: "Avian Influenza",
};

export default function MapPage() {
  const [districts, setDistricts] = useState<LivestockDistrict[]>([]);
  const [selectedDisease, setSelectedDisease] = useState("fmd");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLivestockDistricts()
      .then(setDistricts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Assign mock risk tiers for visualization
  const riskTiers = ["Low", "Medium", "High", "Critical"];
  const getDistrictRisk = (districtId: string): string => {
    const hash = districtId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return riskTiers[hash % riskTiers.length];
  };
  const RISK_COLORS: Record<string, string> = {
    Low: "#22c55e", Medium: "#eab308", High: "#f97316", Critical: "#ef4444",
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#d4af37" }}>🗺️ Risk Map</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Geospatial disease risk mapping — Maharashtra
          </p>
        </div>
        {/* Disease Toggle */}
        <div className="flex gap-1">
          {Object.entries(DISEASE_LABELS).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSelectedDisease(id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: selectedDisease === id ? `${DISEASE_COLORS[id]}20` : "rgba(255,255,255,0.04)",
                color: selectedDisease === id ? DISEASE_COLORS[id] : "rgba(255,255,255,0.4)",
                border: `1px solid ${selectedDisease === id ? DISEASE_COLORS[id] : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map Area ─────────────────────────────── */}
      <div className="rounded-xl overflow-hidden mb-6" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        height: "500px",
        position: "relative",
      }}>
        {/* Static map visualization — Maharashtra districts positioned */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: "90%", height: "90%" }}>
            {/* Maharashtra outline (simplified) */}
            <svg viewBox="0 0 600 400" className="w-full h-full" style={{ opacity: 0.3 }}>
              <path d="M50,200 Q100,50 250,80 Q350,30 450,100 Q550,130 550,250 Q500,350 350,350 Q200,380 100,300 Q50,260 50,200Z"
                fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="2" />
            </svg>

            {/* District markers */}
            {districts.map((d) => {
              const risk = getDistrictRisk(d.id + selectedDisease);
              const color = RISK_COLORS[risk];
              // Map lat/lon to SVG coordinates (approximate)
              const x = ((d.lon - 73) / (80 - 73)) * 80 + 10;
              const y = ((21.5 - d.lat) / (21.5 - 16)) * 80 + 10;

              return (
                <div
                  key={d.id}
                  className="absolute flex flex-col items-center group cursor-pointer transition-all"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Pulse ring */}
                  <div className="absolute w-8 h-8 rounded-full animate-ping" style={{
                    background: `${color}20`, animationDuration: "2s",
                  }} />
                  {/* Marker */}
                  <div className="relative w-5 h-5 rounded-full z-10 flex items-center justify-center" style={{
                    background: color, boxShadow: `0 0 12px ${color}60`,
                  }}>
                    <span className="text-[8px] font-bold" style={{ color: "#0a1628" }}>
                      {risk[0]}
                    </span>
                  </div>
                  {/* Label */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 whitespace-nowrap px-2 py-1 rounded text-[10px] z-20" style={{
                    background: "rgba(0,0,0,0.8)", color: "white",
                  }}>
                    {d.name} — {risk}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-3 px-4 py-2 rounded-lg" style={{
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        }}>
          {Object.entries(RISK_COLORS).map(([tier, color]) => (
            <span key={tier} className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {tier}
            </span>
          ))}
        </div>

        {/* Disease info overlay */}
        <div className="absolute top-4 left-4 px-4 py-3 rounded-lg" style={{
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        }}>
          <p className="text-xs font-semibold" style={{ color: DISEASE_COLORS[selectedDisease] }}>
            {DISEASE_LABELS[selectedDisease]}
          </p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            {districts.length} districts monitored
          </p>
        </div>
      </div>

      {/* ── District Risk Table ──────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            District Risk Levels — {DISEASE_LABELS[selectedDisease]}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {districts.map((d) => {
            const risk = getDistrictRisk(d.id + selectedDisease);
            return (
              <div key={d.id} className="flex items-center gap-3 px-6 py-3 border-b border-r" style={{
                borderColor: "rgba(255,255,255,0.04)",
              }}>
                <div className="w-3 h-3 rounded-full" style={{ background: RISK_COLORS[risk] }} />
                <div className="flex-1">
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{d.name}</span>
                  <span className="text-[10px] ml-2" style={{ color: "rgba(255,255,255,0.3)" }}>{d.division}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded" style={{
                  background: `${RISK_COLORS[risk]}15`, color: RISK_COLORS[risk],
                }}>
                  {risk}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
