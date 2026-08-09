"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useRouter } from "next/navigation";
import { District, ForecastPoint } from "@/lib/api-client";
import "leaflet/dist/leaflet.css";

interface IndiaMapProps {
  districts: District[];
  predictions: ForecastPoint[];
  selectedDisease: string;
}

function getRiskColor(tier: string): string {
  switch (tier?.toLowerCase()) {
    case "critical":
      return "#f43f5e";
    case "high":
      return "#fb923c";
    case "medium":
      return "#fbbf24";
    default:
      return "#34d399";
  }
}

export default function IndiaMap({ districts, predictions, selectedDisease }: IndiaMapProps) {
  const router = useRouter();

  // Create lookup for disease prediction per district
  const predMap: Record<string, ForecastPoint> = {};
  predictions.forEach((p) => {
    if (p.disease.toLowerCase() === selectedDisease.toLowerCase()) {
      if (!predMap[p.district_id] || p.week_start < predMap[p.district_id].week_start) {
        predMap[p.district_id] = p;
      }
    }
  });

  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      minZoom={4}
      maxZoom={8}
      scrollWheelZoom={true}
      className="h-[440px] w-full rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl"
      style={{ background: "#09090e" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> & Dynamic EpiWatch AI Engine'
      />

      {districts.map((d) => {
        const pred = predMap[d.id];
        const tier = pred ? pred.risk_tier : "Low";
        const color = getRiskColor(tier);
        const cases = pred ? pred.predicted_cases : 0;
        const radius = Math.max(10, Math.min(28, Math.log10(cases + 10) * 8));

        return (
          <CircleMarker
            key={d.id}
            center={[d.lat, d.lon]}
            radius={radius}
            eventHandlers={{
              click: () => router.push(`/district/${d.id}`),
            }}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.6,
              color: color,
              weight: 2,
              opacity: 0.9,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} className="!bg-transparent !border-none !shadow-none !p-0">
              <div
                style={{
                  background: "#11111a",
                  border: `1px solid ${color}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#f0f0f5",
                  fontSize: 12,
                  lineHeight: 1.6,
                  minWidth: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <strong className="text-sm text-white font-bold">{d.name}</strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: `${color}22`, color }}>
                    {tier} Risk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono border-t border-[#222233] pt-2">
                  <span style={{ color: "#8888a0" }}>State</span>
                  <span className="text-right text-slate-300">{d.state}</span>

                  <span style={{ color: "#8888a0" }}>Disease</span>
                  <span className="text-right text-indigo-400 capitalize">{selectedDisease}</span>

                  <span style={{ color: "#8888a0" }}>Predicted Cases</span>
                  <span className="text-right font-bold text-emerald-400">{cases.toLocaleString()}</span>

                  <span style={{ color: "#8888a0" }}>Population</span>
                  <span className="text-right text-slate-400">{(d.population / 1000000).toFixed(1)}M</span>
                </div>
                <div className="mt-2 text-[10px] text-center text-indigo-300 underline font-sans">
                  Click for 8-Week Forecast →
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
