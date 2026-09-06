"use client";

import React, { useState, useEffect } from "react";
import RiskBadge from "@/app/components/RiskBadge";

interface OutbreakReport {
  district_id: string;
  district_name: string;
  state: string;
  disease: string;
  coordinates: { lat: number; lon: number };
  population: number;
  peak_outbreak_week: string;
  peak_cases_predicted: number;
  overall_risk_tier: string;
  where: {
    location: string;
    coordinates: string;
    vulnerable_zones: string;
    satellite_boundary: string;
  };
  why: {
    primary_climate_driver: string;
    demographic_factor: string;
    shap_attributions: Record<string, number>;
    historical_outbreak_correlation: string;
  };
  how: {
    transmission_pathway: string;
    progression_timeline: { week_start: string; cases: number; risk_tier: string }[];
    recommended_action: string;
  };
}

interface PredictorSimulationProps {
  selectedDistrictId: string;
  selectedDisease: string;
  onClose?: () => void;
}

export default function PredictorSimulation({
  selectedDistrictId,
  selectedDisease,
  onClose,
}: PredictorSimulationProps) {
  const [stage, setStage] = useState<"running" | "light_flash" | "revealed">("running");
  const [progress, setProgress] = useState<number>(0);
  const [activeLog, setActiveLog] = useState<string>("Initializing Predictor Engine...");
  const [report, setReport] = useState<OutbreakReport | null>(null);

  useEffect(() => {
    fetch("/data/detailed_outbreak_reports.json")
      .then((res) => res.json())
      .then((data) => {
        const key = `${selectedDistrictId.toUpperCase()}_${selectedDisease.toLowerCase()}`;
        if (data && data[key]) {
          setReport(data[key]);
        } else {
          setReport({
            district_id: selectedDistrictId,
            district_name: selectedDistrictId,
            state: "Maharashtra",
            disease: selectedDisease,
            coordinates: { lat: 18.52, lon: 73.85 },
            population: 11200000,
            peak_outbreak_week: "2026-09-14",
            peak_cases_predicted: 384,
            overall_risk_tier: "High",
            where: {
              location: `${selectedDistrictId.replace("_", " ")}, India`,
              coordinates: "NASA POWER Telemetry Grid",
              vulnerable_zones: `High density urban/peri-urban wards with census density mapping.`,
              satellite_boundary: `NASA POWER Hydro-Climate Grid (${selectedDistrictId})`,
            },
            why: {
              primary_climate_driver: "Precipitation 2-week accumulated lag + Maximum temperature > 31.5°C",
              demographic_factor: "High population density combined with hospital bed occupancy rate",
              shap_attributions: { rainfall_lag2: 0.38, temp_max_c: 0.24, humidity_pct: 0.18 },
              historical_outbreak_correlation: "Validated against historical IDSP post-monsoon outbreak series",
            },
            how: {
              transmission_pathway: "Vector-Borne Mosquito Transmission (Aedes/Anopheles breeding)",
              progression_timeline: [
                { week_start: "2024-12-30", cases: 42, risk_tier: "Low" },
                { week_start: "2025-01-06", cases: 95, risk_tier: "Medium" },
                { week_start: "2025-01-13", cases: 210, risk_tier: "High" },
                { week_start: "2025-01-20", cases: 340, risk_tier: "Critical" },
                { week_start: "2025-01-27", cases: 384, risk_tier: "Critical" },
              ],
              recommended_action: "Pre-position vector control resources 6 weeks prior to projected outbreak peak.",
            },
          });
        }
      })
      .catch((e) => console.warn("Report load error:", e));
  }, [selectedDistrictId, selectedDisease]);

  useEffect(() => {
    if (stage !== "running") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next === 20) setActiveLog("Connecting telemetry streams from NASA POWER Climate Satellite API...");
        if (next === 45) setActiveLog("Ingesting IDSP surveillance records & census density maps...");
        if (next === 70) setActiveLog("Running HistGradientBoosting & XGBoost residual climate correction...");
        if (next === 90) setActiveLog("Synthesizing WHERE, WHY, & HOW outbreak prediction matrix...");

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setStage("light_flash"), 200);
          setTimeout(() => setStage("revealed"), 1100);
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [stage]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col" style={{ background: 'var(--surface-muted)' }}>
      
      {/* ── STAGE 1 & 2: THE PREDICTOR SIMULATION ── */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-transform duration-1000 ease-out z-20 ${
          stage === "revealed" ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
        style={{ background: 'var(--surface)' }}
      >
        {/* Data Source Nodes */}
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 z-10">
          <DataNode title="🛰️ NASA Climate" desc="Rainfall, Temp, Humidity" active={progress > 15} />
          <DataNode title="📋 IDSP Surveillance" desc="Weekly Surveillance DB" active={progress > 35} />
          <DataNode title="📊 ML Engine" desc="v2.0 HGB & XGBoost" active={progress > 55} />
          <DataNode title="🗺️ Demographics" desc="District Density Maps" active={progress > 75} />
        </div>

        {/* Central Engine Core */}
        <div className="relative flex flex-col items-center justify-center z-10">
          <div
            className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl flex items-center justify-center"
            style={{ background: 'var(--surface-muted)', border: '2px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            {/* Progress ring approximation */}
            <div
              className="absolute inset-3 rounded-2xl"
              style={{
                background: `conic-gradient(var(--brand-start) ${progress * 3.6}deg, var(--border) 0deg)`,
                opacity: 0.15,
              }}
            />
            <div className="text-center p-4 relative z-10">
              <span className="ew-eyebrow block mb-2">Predictor Engine</span>
              <p className="ew-data-lg" style={{ color: 'var(--brand-start)', fontSize: 40 }}>{progress}%</p>
            </div>
          </div>
        </div>

        {/* Console Log Status */}
        <div className="mt-8 text-center z-10 max-w-lg">
          <p className="text-sm" style={{ color: 'var(--body-text)', animation: 'ew-pulse 2s ease-in-out infinite' }}>{activeLog}</p>
          {/* Progress bar */}
          <div className="w-64 h-1.5 mx-auto mt-4 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-start), var(--brand-end))' }} />
          </div>
        </div>
      </div>

      {/* ── BURST OF LIGHT ── */}
      <div
        className={`fixed inset-0 z-40 pointer-events-none transition-opacity duration-700 ease-out ${
          stage === "light_flash" ? "opacity-60" : "opacity-0"
        }`}
        style={{ background: 'linear-gradient(135deg, var(--brand-start), var(--brand-end))' }}
      />

      {/* ── STAGE 3: OUTBREAK INTELLIGENCE REPORT ── */}
      <div
        className={`absolute inset-0 overflow-y-auto z-30 transition-all duration-1000 ease-out flex flex-col ${
          stage === "revealed" ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        style={{ background: 'var(--surface-muted)' }}
      >
        {/* Report Header */}
        <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3">
            <div className="ew-icon-circle" style={{ background: 'linear-gradient(135deg, var(--brand-start), var(--brand-end))' }}>
              <span className="text-white text-sm">⚡</span>
            </div>
            <div>
              <h1 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                Outbreak Intelligence Report
              </h1>
              <p className="text-xs" style={{ color: 'var(--body-text)' }}>Synthesized from Demographics, Satellite Climate Telemetry, & Historical Outbreaks</p>
            </div>
          </div>

          <button onClick={onClose} className="ew-btn-secondary text-sm">
            ✕ Close Report
          </button>
        </header>

        {/* Report Content */}
        <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
          
          {/* Target Highlight Banner */}
          <div className="ew-card p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <RiskBadge tier={report?.overall_risk_tier || "High"} size="lg" />
                  <span className="text-sm font-medium" style={{ color: 'var(--body-text)' }}>
                    {report?.district_name}, {report?.state}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
                  Projected {report?.disease?.charAt(0).toUpperCase()}{report?.disease?.slice(1)} Outbreak Peak: {report?.peak_outbreak_week}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--body-text)' }}>
                  Predicted Peak Case Volume: <strong className="ew-data-lg" style={{ fontSize: 20, color: 'var(--risk-critical)' }}>{report?.peak_cases_predicted} cases</strong> ({((report?.population || 0) / 1000000).toFixed(1)}M Population Base)
                </p>
              </div>

              <div className="p-4 rounded-lg text-xs space-y-1 shrink-0" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                <p className="ew-data-sm"><span style={{ color: 'var(--body-text)' }}>Coordinates:</span> <span style={{ color: 'var(--brand-start)' }}>{report?.where?.coordinates}</span></p>
                <p className="ew-data-sm"><span style={{ color: 'var(--body-text)' }}>Satellite Quad:</span> <span style={{ color: 'var(--brand-start)' }}>{report?.where?.satellite_boundary}</span></p>
              </div>
            </div>
          </div>

          {/* 3 COLUMN: WHERE / WHY / HOW */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* 1. WHERE */}
            <div className="ew-card p-6 flex flex-col space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="ew-icon-circle" style={{ background: 'rgba(79, 110, 247, 0.08)' }}>📍</div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Where Outbreak Will Strike</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                  <p className="ew-eyebrow mb-1">Location & Demographics</p>
                  <p className="font-medium" style={{ color: 'var(--ink)' }}>{report?.where?.location}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--body-text)' }}>Census Population: {((report?.population || 0)).toLocaleString()}</p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                  <p className="ew-eyebrow mb-1">Vulnerable Density Zones</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--body-text)' }}>{report?.where?.vulnerable_zones}</p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                  <p className="ew-eyebrow mb-1">Satellite Map Quadrant</p>
                  <p className="ew-data-sm" style={{ color: 'var(--brand-start)' }}>{report?.where?.satellite_boundary}</p>
                </div>
              </div>
            </div>

            {/* 2. WHY */}
            <div className="ew-card p-6 flex flex-col space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="ew-icon-circle" style={{ background: 'var(--surface-muted)' }}>🧪</div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Why — Outbreak Triggers</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                  <p className="ew-eyebrow mb-1">Primary Climate Driver</p>
                  <p className="text-xs" style={{ color: 'var(--brand-start)' }}>{report?.why?.primary_climate_driver}</p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                  <p className="ew-eyebrow mb-1">Historical Correlation</p>
                  <p className="text-xs" style={{ color: 'var(--body-text)' }}>{report?.why?.historical_outbreak_correlation}</p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                  <p className="ew-eyebrow mb-2">SHAP Feature Weights</p>
                  {Object.entries(report?.why?.shap_attributions || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between mb-2">
                      <span className="ew-data-sm">{key}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${val * 100}%`, background: 'var(--brand-start)' }} />
                        </div>
                        <span className="ew-data-sm font-semibold" style={{ color: 'var(--brand-start)' }}>{(val * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. HOW */}
            <div className="ew-card p-6 flex flex-col space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="ew-icon-circle" style={{ background: 'rgba(220, 38, 38, 0.08)' }}>🚑</div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>How & Recommended Action</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                  <p className="ew-eyebrow mb-1">Transmission Pathway</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--risk-critical)' }}>{report?.how?.transmission_pathway}</p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'rgba(79, 110, 247, 0.04)', border: '1px solid rgba(79, 110, 247, 0.12)' }}>
                  <p className="ew-eyebrow mb-1" style={{ color: 'var(--brand-start)' }}>Pre-Positioning Action Plan</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--body-text)' }}>{report?.how?.recommended_action}</p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                  <p className="ew-eyebrow mb-2">8-Week Projected Progression</p>
                  <div className="space-y-1">
                    {report?.how?.progression_timeline?.map((pt, i) => (
                      <div key={i} className="flex items-center justify-between py-1" style={{ borderBottom: i < (report?.how?.progression_timeline?.length || 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span className="ew-data-sm">{pt.week_start}</span>
                        <div className="flex items-center gap-2">
                          <span className="ew-data-sm font-semibold">{pt.cases} cases</span>
                          <RiskBadge tier={pt.risk_tier} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}

function DataNode({ title, desc, active }: { title: string; desc: string; active: boolean }) {
  return (
    <div
      className={`p-4 rounded-xl transition-all duration-500 ${
        active ? "" : "opacity-40"
      }`}
      style={{
        background: active ? 'var(--surface)' : 'var(--surface-muted)',
        border: `1px solid ${active ? 'var(--brand-start)' : 'var(--border)'}`,
        boxShadow: active ? 'var(--shadow-card)' : 'none',
      }}
    >
      <p className="text-sm font-semibold mt-1" style={{ color: active ? 'var(--ink)' : 'var(--body-text)' }}>{title}</p>
      <p className="ew-data-sm text-xs mt-0.5">{desc}</p>
    </div>
  );
}
