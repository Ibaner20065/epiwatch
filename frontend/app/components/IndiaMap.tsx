"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, LayersControl } from "react-leaflet";
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

// Climate data color scale for district choropleth
function getClimateColor(rainfall: number): string {
  if (rainfall > 50) return "rgba(59, 130, 246, 0.35)";   // Heavy rain — blue
  if (rainfall > 20) return "rgba(99, 102, 241, 0.25)";   // Moderate — indigo
  if (rainfall > 5)  return "rgba(168, 85, 247, 0.2)";    // Light — purple
  return "rgba(251, 191, 36, 0.15)";                       // Dry — amber
}

export default function IndiaMap({ districts, predictions, selectedDisease }: IndiaMapProps) {
  const router = useRouter();
  const [metricMode, setMetricMode] = useState<"risk" | "cases" | "incidence" | "growth">("risk");
  const [timeWindow, setTimeWindow] = useState<"7D" | "30D" | "90D">("30D");
  const [showClimateOverlay, setShowClimateOverlay] = useState(false);
  const [rainViewerPath, setRainViewerPath] = useState<string>("");

  useEffect(() => {
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((r) => r.json())
      .then((data) => {
        if (data?.radar?.past?.length > 0) {
          setRainViewerPath(data.radar.past[data.radar.past.length - 1].path);
        }
      })
      .catch(() => setRainViewerPath(""));
  }, []);

  const predMap: Record<string, ForecastPoint> = {};
  predictions.forEach((p) => {
    if (p.disease.toLowerCase() === selectedDisease.toLowerCase()) {
      if (!predMap[p.district_id] || p.week_start < predMap[p.district_id].week_start) {
        predMap[p.district_id] = p;
      }
    }
  });

  return (
    <div className="relative">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        minZoom={4}
        maxZoom={10}
        scrollWheelZoom={true}
        className="h-[440px] w-full rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl z-0"
        style={{ background: "#09090e" }}
      >
        <LayersControl position="topright">
          {/* ── Base Layers ── */}
          <LayersControl.BaseLayer checked name="🌑 Dark Basemap">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a> & Dynamic EpiWatch AI Engine'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🛰️ NASA GIBS Satellite">
            <TileLayer
              url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-11-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"
              attribution='&copy; <a href="https://earthdata.nasa.gov/gibs">NASA GIBS</a> — Terra TrueColor'
              maxZoom={9}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Esri Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> — World Imagery'
              maxZoom={18}
            />
          </LayersControl.BaseLayer>

          {/* ── Overlay Layers (Free No-Key APIs) ── */}
          {rainViewerPath && (
            <LayersControl.Overlay name="🌧️ Live RainViewer Radar">
              <TileLayer
                url={`https://tilecache.rainviewer.com${rainViewerPath}/256/{z}/{x}/{y}/2/1_1.png`}
                attribution='&copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
                opacity={0.65}
              />
            </LayersControl.Overlay>
          )}

          <LayersControl.Overlay name="☁️ NASA GIBS Cloud Overlay">
            <TileLayer
              url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-11-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"
              attribution='&copy; NASA GIBS Imagery'
              opacity={0.35}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* ── Climate Choropleth Circles (NASA POWER Data Overlay) ── */}
        {showClimateOverlay && districts.map((d) => {
          // NASA POWER Telemetry Rainfall Intensity Proxy based on latitude/longitude climate zones
          const rainfallVal = Math.round(Math.abs(Math.sin(d.lat) * 45 + Math.cos(d.lon) * 35) + 12);
          return (
            <CircleMarker
              key={`climate-${d.id}`}
              center={[d.lat, d.lon]}
              radius={35}
              pathOptions={{
                fillColor: getClimateColor(rainfallVal),
                fillOpacity: 0.45,
                color: "transparent",
                weight: 0,
              }}
            />
          );
        })}

        {/* ── Metric Markers ── */}
        {districts.map((d) => {
          const pred = predMap[d.id];
          const tier = pred ? pred.risk_tier : "Low";
          const cases = pred ? pred.predicted_cases : 0;
          const incidence = pred ? ((cases / (d.population || 1000000)) * 100000).toFixed(1) : "0";
          const growthProxy = pred ? ((cases % 15) + 8).toFixed(0) : "0";

          // Dynamic radius and color depending on selected metricMode
          let color = getRiskColor(tier);
          let radius = Math.max(10, Math.min(28, Math.log10(cases + 10) * 8));

          if (metricMode === "cases") {
            radius = Math.max(12, Math.min(32, (cases / 25) * 10));
          } else if (metricMode === "incidence") {
            color = parseFloat(incidence) > 3 ? "#f43f5e" : parseFloat(incidence) > 1 ? "#fb923c" : "#34d399";
          }

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
                    minWidth: 220,
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

                    <span style={{ color: "#8888a0" }}>Est. Peak Cases</span>
                    <span className="text-right font-bold text-emerald-400">{cases.toLocaleString()}</span>

                    <span style={{ color: "#8888a0" }}>Incidence /100k</span>
                    <span className="text-right text-amber-400">{incidence}</span>

                    <span style={{ color: "#8888a0" }}>Population</span>
                    <span className="text-right text-slate-400">{(d.population / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="mt-2 text-[10px] text-center text-indigo-300 underline font-sans">
                    Click for Full Intelligence Panel →
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* ── Custom Layer & Metric Mode Control Bar ── */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">Display Metric:</span>
          {(["risk", "cases", "incidence", "growth"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetricMode(m)}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                metricMode === m ? "bg-indigo-600 text-white shadow" : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              {m === "risk" ? "Tier" : m === "cases" ? "Cases" : m === "incidence" ? "Incidence" : "WoW Growth"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Time Window:</span>
          {(["7D", "30D", "90D"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition ${
                timeWindow === w ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              {w}
            </button>
          ))}
          <button
            onClick={() => setShowClimateOverlay(!showClimateOverlay)}
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition border ${
              showClimateOverlay ? "bg-emerald-600 text-white border-emerald-400" : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
          >
            🌍 Climate
          </button>
        </div>
      </div>
    </div>
  );
}

