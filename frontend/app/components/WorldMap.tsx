"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { formatNum, type CountryDiseaseStats } from "@/lib/disease-api";
import "leaflet/dist/leaflet.css";

/* Map bubble radius scales with case count (log scale for readability) */
function bubbleRadius(cases: number): number {
  if (cases <= 0) return 2;
  return Math.max(3, Math.min(30, Math.log10(cases) * 3.5));
}

/* Risk color based on cases per million */
function riskColor(casesPerMillion: number): string {
  if (casesPerMillion > 300_000) return "#f43f5e";   // Critical
  if (casesPerMillion > 100_000) return "#fb923c";   // High
  if (casesPerMillion > 30_000)  return "#fbbf24";   // Medium
  return "#34d399";                                   // Low
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
      className="h-[380px] w-full rounded-xl"
      style={{ background: "#0a0a0f" }}
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
              fillOpacity: 0.5,
              color: color,
              weight: 1,
              opacity: 0.8,
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              className="!bg-transparent !border-none !shadow-none !p-0"
            >
              <div
                style={{
                  background: "#111118",
                  border: "1px solid #1e1e30",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "#f0f0f5",
                  fontSize: 12,
                  lineHeight: 1.6,
                  minWidth: 180,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.countryInfo.flag}
                    alt={c.country}
                    style={{ width: 24, height: 16, borderRadius: 3, objectFit: "cover" }}
                  />
                  <strong style={{ fontSize: 13 }}>{c.country}</strong>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px" }}>
                  <span style={{ color: "#8888a0" }}>Population</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace" }}>{formatNum(c.population)}</span>

                  <span style={{ color: "#8888a0" }}>Cases</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace", color: "#6366f1" }}>{formatNum(c.cases)}</span>

                  <span style={{ color: "#8888a0" }}>Deaths</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace", color: "#f43f5e" }}>{formatNum(c.deaths)}</span>

                  <span style={{ color: "#8888a0" }}>Recovered</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace", color: "#34d399" }}>{formatNum(c.recovered)}</span>

                  <span style={{ color: "#8888a0" }}>Cases/1M</span>
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
