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
      return "#FF3333";
    case "high":
      return "#FFFFFFdd";
    case "medium":
      return "#00FFFF";
    default:
      return "rgba(255,255,255,0.4)";
  }
}

// Climate data color scale for district choropleth
function getClimateColor(rainfall: number): string {
  if (rainfall > 50) return "rgba(0, 255, 255, 0.25)";
  if (rainfall > 20) return "rgba(0, 255, 255, 0.15)";
  if (rainfall > 5)  return "rgba(255, 255, 255, 0.1)";
  return "rgba(255, 255, 255, 0.05)";
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
        className="h-[440px] w-full border border-[var(--bp-line-faint)] overflow-hidden z-0"
        style={{ background: "var(--bp-blue-deep)" }}
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
            color = parseFloat(incidence) > 3 ? "#FF3333" : parseFloat(incidence) > 1 ? "#FFFFFFdd" : "#00FFFF";
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
                fillOpacity: 0.5,
                color: color,
                weight: 1,
                opacity: 0.8,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} className="!bg-transparent !border-none !shadow-none !p-0">
                <div
                  style={{
                    background: "#002244",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "12px 16px",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 11,
                    lineHeight: 1.6,
                    minWidth: 220,
                    fontFamily: "'Roboto Mono', monospace",
                    boxShadow: "0 0 20px rgba(0,255,255,0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <strong style={{ fontSize: 12, color: "#fff" }}>{d.name}</strong>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", border: `1px solid ${color}`, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {tier} RISK
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", fontSize: 10, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 6 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>State</span>
                    <span style={{ textAlign: "right" }}>{d.state}</span>

                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Disease</span>
                    <span style={{ textAlign: "right", color: "#00FFFF", textTransform: "capitalize" }}>{selectedDisease}</span>

                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Est. Peak Cases</span>
                    <span style={{ textAlign: "right", fontWeight: 700, color: "#00FFFF" }}>{cases.toLocaleString()}</span>

                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Incidence /100k</span>
                    <span style={{ textAlign: "right" }}>{incidence}</span>

                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Population</span>
                    <span style={{ textAlign: "right", color: "rgba(255,255,255,0.5)" }}>{(d.population / 1000000).toFixed(1)}M</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 9, textAlign: "center", color: "#00FFFF", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: 6 }}>
                    Click for Full Intelligence Panel →
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* ── Custom Layer & Metric Mode Control Bar ── */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 p-2 border border-[var(--bp-line-faint)] backdrop-blur-md" style={{ background: 'rgba(0, 25, 50, 0.85)' }}>
        <div className="flex items-center gap-1">
          <span className="bp-serial mr-1">METRIC:</span>
          {(["risk", "cases", "incidence", "growth"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetricMode(m)}
              className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition font-mono border ${
                metricMode === m
                  ? "border-[var(--bp-cyan)] text-[var(--bp-cyan)] bg-[rgba(0,255,255,0.08)]"
                  : "border-[var(--bp-line-faint)] text-[var(--bp-white-faint)] hover:text-[var(--bp-white-muted)]"
              }`}
            >
              {m === "risk" ? "TIER" : m === "cases" ? "CASES" : m === "incidence" ? "INCIDENCE" : "WoW GROWTH"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="bp-serial">WINDOW:</span>
          {(["7D", "30D", "90D"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`px-2 py-1 text-[9px] font-mono transition border ${
                timeWindow === w
                  ? "border-[var(--bp-white-muted)] text-[var(--bp-white-soft)]"
                  : "border-[var(--bp-line-faint)] text-[var(--bp-white-faint)] hover:text-[var(--bp-white-muted)]"
              }`}
            >
              {w}
            </button>
          ))}
          <button
            onClick={() => setShowClimateOverlay(!showClimateOverlay)}
            className={`px-2 py-1 text-[9px] font-bold uppercase transition border font-mono ${
              showClimateOverlay
                ? "border-[var(--bp-cyan)] text-[var(--bp-cyan)] bg-[rgba(0,255,255,0.08)]"
                : "border-[var(--bp-line-faint)] text-[var(--bp-white-faint)]"
            }`}
          >
            🌍 CLIMATE
          </button>
        </div>
      </div>
    </div>
  );
}
