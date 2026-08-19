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
  const [activeLog, setActiveLog] = useState<string>("Initializing Predictor Engine Neural Core...");
  const [report, setReport] = useState<OutbreakReport | null>(null);

  useEffect(() => {
    // Fetch detailed outbreak report
    fetch("/data/detailed_outbreak_reports.json")
      .then((res) => res.json())
      .then((data) => {
        const key = `${selectedDistrictId.toUpperCase()}_${selectedDisease.toLowerCase()}`;
        if (data && data[key]) {
          setReport(data[key]);
        } else {
          // Default mock report structure if key missing
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
          // Trigger Flash of Light effect
          setTimeout(() => setStage("light_flash"), 200);
          // Trigger Slide-Up curtain reveal after light flash
          setTimeout(() => setStage("revealed"), 1100);
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [stage]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-[var(--bp-white-soft)] flex flex-col font-mono" style={{ background: 'var(--bp-blue-dark)' }}>
      
      {/* ── STAGE 1 & 2: THE PREDICTOR AI SIMULATION ── */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-transform duration-1000 ease-in-out z-20 ${
          stage === "revealed" ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
        style={{ background: 'var(--bp-blue-dark)' }}
      >
        {/* Blueprint grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
        }} />

        {/* 4 Source Data Stream Nodes */}
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 z-10">
          <DataNode title="🛰️ NASA CLIMATE" desc="Rainfall, Temp, Humidity" serial="NODE-01" active={progress > 15} />
          <DataNode title="📋 IDSP SURVEILLANCE" desc="IDSP Weekly Surveillance DB" serial="NODE-02" active={progress > 35} />
          <DataNode title="📊 ML ENGINE" desc="v2.0 HGB & XGBoost Models" serial="NODE-03" active={progress > 55} />
          <DataNode title="🗺️ DEMOGRAPHICS" desc="District Density Maps" serial="NODE-04" active={progress > 75} />
        </div>

        {/* Central Blueprint Engine Core */}
        <div className="relative flex flex-col items-center justify-center z-10">
          {/* Glow ring */}
          <div className="absolute -inset-16 border border-dashed border-[var(--bp-cyan-dim)] opacity-30" style={{ animation: 'bp-spin 20s linear infinite' }} />
          
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-[var(--bp-cyan-dim)] flex items-center justify-center" style={{ background: 'rgba(0,20,40,0.8)', boxShadow: '0 0 60px rgba(0,255,255,0.12)' }}>
            {/* Corner crosshairs */}
            <span className="absolute -top-2 -left-1 text-[10px] font-mono" style={{ color: 'var(--bp-cyan-dim)' }}>+</span>
            <span className="absolute -top-2 -right-1 text-[10px] font-mono" style={{ color: 'var(--bp-cyan-dim)' }}>+</span>
            <span className="absolute -bottom-2 -left-1 text-[10px] font-mono" style={{ color: 'var(--bp-cyan-dim)' }}>+</span>
            <span className="absolute -bottom-2 -right-1 text-[10px] font-mono" style={{ color: 'var(--bp-cyan-dim)' }}>+</span>
            
            {/* Spinning wireframe rings */}
            <div className="absolute inset-4 border-t border-[var(--bp-cyan)]" style={{ animation: 'bp-spin 3s linear infinite' }} />
            <div className="absolute inset-8 border-r border-[var(--bp-white-faint)]" style={{ animation: 'bp-spin 5s linear infinite reverse' }} />
            <div className="absolute inset-12 border-b border-[var(--bp-cyan-dim)]" style={{ animation: 'bp-spin 8s linear infinite' }} />

            <div className="text-center p-4">
              <span className="bp-serial block mb-1">[SYS-CORE]</span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-[0.3em] uppercase" style={{ color: 'var(--bp-cyan)' }}>
                PREDICTOR
              </h3>
              <p className="text-3xl font-bold font-mono mt-1" style={{ color: 'var(--bp-white)' }}>{progress}%</p>
            </div>
          </div>
        </div>

        {/* Console Log Status */}
        <div className="mt-8 text-center z-10 max-w-lg">
          <p className="text-[10px] font-mono" style={{ color: 'var(--bp-cyan-dim)', animation: 'bp-pulse 2s ease-in-out infinite' }}>{activeLog}</p>
          {/* Blueprint dimension-style progress bar */}
          <div className="w-64 h-1 mx-auto mt-3 overflow-hidden border border-[var(--bp-line-faint)]" style={{ background: 'var(--bp-blue-deep)' }}>
            <div className="h-full transition-all duration-150" style={{ width: `${progress}%`, background: 'var(--bp-cyan)' }} />
          </div>
          <div className="flex justify-between text-[8px] mt-1 w-64 mx-auto" style={{ color: 'var(--bp-white-faint)' }}>
            <span>0%</span>
            <span>&lt;── {progress}% ──&gt;</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* ── BURST OF LIGHT TRANSITION EFFECT ── */}
      <div
        className={`fixed inset-0 z-40 pointer-events-none transition-opacity duration-700 ease-out ${
          stage === "light_flash" ? "opacity-80" : "opacity-0"
        }`}
        style={{ background: 'var(--bp-cyan)' }}
      />

      {/* ── STAGE 3: THE OUTBREAK INTELLIGENCE REPORT (REVEALED VIEW) ── */}
      <div
        className={`absolute inset-0 overflow-y-auto z-30 transition-all duration-1000 ease-out flex flex-col ${
          stage === "revealed" ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        style={{ background: 'var(--bp-blue-dark)' }}
      >
        {/* Report Header Bar */}
        <header className="sticky top-0 z-50 border-b border-[var(--bp-line-faint)] px-6 py-4 backdrop-blur-md flex items-center justify-between" style={{ background: 'rgba(0, 20, 40, 0.9)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-dashed border-[var(--bp-redline)] flex items-center justify-center text-lg font-bold" style={{ color: 'var(--bp-redline)' }}>
              ⚡
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--bp-white-soft)' }}>
                <span className="bp-serial">[RPT-001]</span> PREDICTOR Outbreak Intelligence Report
              </h1>
              <p className="text-[9px]" style={{ color: 'var(--bp-white-faint)' }}>Synthesized from Demographics, Satellite Climate Telemetry, &amp; Historical Outbreaks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bp-btn text-[9px]"
          >
            ✕ CLOSE REPORT
          </button>
        </header>

        {/* Report Main View */}
        <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
          
          {/* Target Highlight Banner */}
          <div className="blueprint-card p-6">
            <div className="bp-corners">
              <span className="corner-tr">+</span>
              <span className="corner-bl">+</span>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <RiskBadge tier={report?.overall_risk_tier || "High"} size="lg" />
                  <span className="bp-coord">Target: {report?.district_name}, {report?.state}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider" style={{ color: 'var(--bp-white-soft)' }}>
                  Projected {report?.disease.toUpperCase()} Outbreak Peak: {report?.peak_outbreak_week}
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--bp-white-muted)' }}>
                  Predicted Peak Case Volume: <strong className="font-mono text-base" style={{ color: 'var(--bp-redline)' }}>{report?.peak_cases_predicted} cases</strong> ({((report?.population || 0) / 1000000).toFixed(1)}M Population Base)
                </p>
              </div>

              <div className="p-4 border border-[var(--bp-line-faint)] text-[10px] font-mono space-y-1 shrink-0">
                <p style={{ color: 'var(--bp-white-faint)' }}>Coordinates: <span style={{ color: 'var(--bp-cyan)' }}>{report?.where?.coordinates}</span></p>
                <p style={{ color: 'var(--bp-white-faint)' }}>Satellite Quad: <span style={{ color: 'var(--bp-cyan)' }}>{report?.where?.satellite_boundary}</span></p>
              </div>
            </div>
          </div>

          {/* 3 COLUMN CORE ANALYTICS: WHERE / WHY / HOW */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* 1. WHERE */}
            <div className="blueprint-card p-6 flex flex-col justify-between space-y-4">
              <div className="bp-corners">
                <span className="corner-tr">+</span>
                <span className="corner-bl">+</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 border border-[var(--bp-cyan)] flex items-center justify-center text-sm" style={{ color: 'var(--bp-cyan)' }}>📍</span>
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                    <span className="bp-serial">[SEC-01]</span> WHERE Outbreak Will Strike
                  </h3>
                </div>

                <div className="space-y-3 text-[10px]">
                  <div className="p-3 border border-[var(--bp-line-faint)]">
                    <p className="font-bold mb-1" style={{ color: 'var(--bp-white-muted)' }}>Location &amp; Demographics</p>
                    <p className="font-bold text-xs" style={{ color: 'var(--bp-white-soft)' }}>{report?.where?.location}</p>
                    <p className="mt-1" style={{ color: 'var(--bp-white-faint)' }}>Census Population: {((report?.population || 0)).toLocaleString()}</p>
                  </div>

                  <div className="p-3 border border-[var(--bp-line-faint)]">
                    <p className="font-bold mb-1" style={{ color: 'var(--bp-white-muted)' }}>Vulnerable Density Zones</p>
                    <p className="leading-relaxed" style={{ color: 'var(--bp-white-faint)' }}>{report?.where?.vulnerable_zones}</p>
                  </div>

                  <div className="p-3 border border-[var(--bp-line-faint)]">
                    <p className="font-bold mb-1" style={{ color: 'var(--bp-white-muted)' }}>Satellite Map Quadrant</p>
                    <p className="font-mono" style={{ color: 'var(--bp-cyan)' }}>{report?.where?.satellite_boundary}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. WHY */}
            <div className="blueprint-card p-6 flex flex-col justify-between space-y-4">
              <div className="bp-corners">
                <span className="corner-tr">+</span>
                <span className="corner-bl">+</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 border border-[var(--bp-white-muted)] flex items-center justify-center text-sm" style={{ color: 'var(--bp-white-muted)' }}>🧪</span>
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                    <span className="bp-serial">[SEC-02]</span> WHY Outbreak Triggers
                  </h3>
                </div>

                <div className="space-y-3 text-[10px]">
                  <div className="p-3 border border-[var(--bp-line-faint)]">
                    <p className="font-bold mb-1" style={{ color: 'var(--bp-white-muted)' }}>Primary Climate Telemetry Driver</p>
                    <p style={{ color: 'var(--bp-cyan)' }}>{report?.why?.primary_climate_driver}</p>
                  </div>

                  <div className="p-3 border border-[var(--bp-line-faint)]">
                    <p className="font-bold mb-1" style={{ color: 'var(--bp-white-muted)' }}>Historical Outbreak Correlation</p>
                    <p style={{ color: 'var(--bp-white-muted)' }}>{report?.why?.historical_outbreak_correlation}</p>
                  </div>

                  <div className="p-3 border border-[var(--bp-line-faint)] space-y-1.5">
                    <p className="font-bold mb-2" style={{ color: 'var(--bp-white-muted)' }}>SHAP Environmental Feature Weights</p>
                    {Object.entries(report?.why?.shap_attributions || {}).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between font-mono">
                        <span style={{ color: 'var(--bp-white-faint)' }}>{key}</span>
                        <span className="font-bold" style={{ color: 'var(--bp-cyan)' }}>{(val * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. HOW */}
            <div className="blueprint-card p-6 flex flex-col justify-between space-y-4">
              <div className="bp-corners">
                <span className="corner-tr">+</span>
                <span className="corner-bl">+</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 border border-[var(--bp-redline)] flex items-center justify-center text-sm" style={{ color: 'var(--bp-redline)' }}>🚑</span>
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                    <span className="bp-serial">[SEC-03]</span> HOW &amp; Recommended Action
                  </h3>
                </div>

                <div className="space-y-3 text-[10px]">
                  <div className="p-3 border border-[var(--bp-line-faint)]">
                    <p className="font-bold mb-1" style={{ color: 'var(--bp-white-muted)' }}>Transmission Pathway</p>
                    <p style={{ color: 'var(--bp-redline)' }}>{report?.how?.transmission_pathway}</p>
                  </div>

                  <div className="p-3 border border-[var(--bp-cyan-dim)]" style={{ background: 'rgba(0,255,255,0.03)' }}>
                    <p className="font-bold mb-1" style={{ color: 'var(--bp-cyan)' }}>Pre-Positioning Action Plan</p>
                    <p className="leading-relaxed" style={{ color: 'var(--bp-white-muted)' }}>{report?.how?.recommended_action}</p>
                  </div>

                  <div className="p-3 border border-[var(--bp-line-faint)]">
                    <p className="font-bold mb-2" style={{ color: 'var(--bp-white-muted)' }}>8-Week Projected Progression</p>
                    <div className="space-y-1 font-mono text-[10px]">
                      {report?.how?.progression_timeline?.map((pt, i) => (
                        <div key={i} className="flex items-center justify-between py-0.5 border-b border-[var(--bp-line-faint)] last:border-none">
                          <span style={{ color: 'var(--bp-white-faint)' }}>{pt.week_start}</span>
                          <span className="font-bold" style={{ color: 'var(--bp-redline)' }}>{pt.cases} cases</span>
                        </div>
                      ))}
                    </div>
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

function DataNode({ title, desc, serial, active }: { title: string; desc: string; serial: string; active: boolean }) {
  return (
    <div
      className={`p-3.5 border transition-all duration-500 ${
        active
          ? "border-[var(--bp-cyan-dim)]"
          : "border-[var(--bp-line-faint)] opacity-40"
      }`}
      style={{
        background: active ? 'rgba(0,255,255,0.03)' : 'transparent',
        boxShadow: active ? '0 0 15px rgba(0,255,255,0.08)' : 'none',
      }}
    >
      <span className="bp-serial">[{serial}]</span>
      <p className="text-[10px] font-bold mt-1" style={{ color: active ? 'var(--bp-white-soft)' : 'var(--bp-white-faint)' }}>{title}</p>
      <p className="text-[9px] font-mono" style={{ color: 'var(--bp-white-faint)' }}>{desc}</p>
    </div>
  );
}
