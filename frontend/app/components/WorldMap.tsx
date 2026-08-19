"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { formatNum, type CountryDiseaseStats } from "@/lib/disease-api";
import "leaflet/dist/leaflet.css";

/* Map bubble radius scales with case count (log scale for readability) */
function bubbleRadius(cases: number): number {
  if (cases <= 0) return 2;
  return Math.max(3, Math.min(30, Math.log10(cases) * 3.5));
}

/* Risk color based on cases per million — blueprint palette */
function riskColor(casesPerMillion: number): string {
  if (casesPerMillion > 300_000) return "#FF3333";       // Critical - Redline
  if (casesPerMillion > 100_000) return "#FFFFFFdd";     // High - White
  if (casesPerMillion > 30_000)  return "#00FFFF";       // Medium - Cyan
  return "rgba(255,255,255,0.35)";                        // Low - Faint
}

interface Props {
  countries: CountryDiseaseStats[];
}

export default function WorldMap({ countries }: Props) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      scrollWheelZoom={true}
      className="h-[380px] w-full border border-[var(--bp-line-faint)]"
      style={{ background: "#002244" }}
    >
      {/* CartoDB dark basemap — no API key needed */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {countries.map((c) => {
        const { lat, long: lng } = c.countryInfo;
        if (!lat || !lng) return null;
        const color = riskColor(c.casesPerOneMillion);

        return (
          <CircleMarker
            key={c.countryInfo._id ?? c.country}
            center={[lat, lng]}
            radius={bubbleRadius(c.cases)}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.4,
              color: color,
              weight: 1,
              opacity: 0.7,
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              className="!bg-transparent !border-none !shadow-none !p-0"
            >
              <div
                style={{
                  background: "#002244",
                  border: "1px solid rgba(255,255,255,0.15)",
                  padding: "10px 14px",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 11,
                  lineHeight: 1.6,
                  minWidth: 180,
                  fontFamily: "'Roboto Mono', monospace",
                  boxShadow: "0 0 15px rgba(0,255,255,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.countryInfo.flag}
                    alt={c.country}
                    style={{ width: 24, height: 16, objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                  <strong style={{ fontSize: 12 }}>{c.country}</strong>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Population</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace" }}>{formatNum(c.population)}</span>

                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Cases</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace", color: "#00FFFF" }}>{formatNum(c.cases)}</span>

                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Deaths</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace", color: "#FF3333" }}>{formatNum(c.deaths)}</span>

                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Recovered</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace", color: "rgba(255,255,255,0.7)" }}>{formatNum(c.recovered)}</span>

                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Cases/1M</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace" }}>{c.casesPerOneMillion.toLocaleString()}</span>
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
