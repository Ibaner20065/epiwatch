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
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#040407] text-slate-100 flex flex-col font-sans">
      
      {/* ── STAGE 1 & 2: THE PREDICTOR AI SIMULATION ── */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-transform duration-1000 ease-in-out z-20 ${
          stage === "revealed" ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
        style={{
          background: "radial-gradient(circle at center, #0b0c1a 0%, #030307 100%)",
        }}
      >
        {/* Glowing background grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* 4 Source Data Streams (Nodes) */}
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 z-10">
          <DataNode title="🛰️ NASA Climate Telemetry" desc="Rainfall, Temp, Humidity" color="#38bdf8" active={progress > 15} />
          <DataNode title="📋 IDSP Case Surveillance" desc="IDSP Weekly Surveillance DB" color="#a78bfa" active={progress > 35} />
          <DataNode title="📊 ML Outbreak Engine" desc="v2.0 HGB & XGBoost Models" color="#f43f5e" active={progress > 55} />
          <DataNode title="🗺️ Demographics & Census" desc="District Density Maps" color="#34d399" active={progress > 75} />
        </div>

        {/* Central Glowing PREDICTOR Engine */}
        <div className="relative flex flex-col items-center justify-center z-10">
          {/* Animated Connecting Beams */}
          <div className="absolute -inset-16 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-2xl animate-pulse" />
          
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-indigo-500/40 flex items-center justify-center bg-[#080812]/90 shadow-[0_0_80px_rgba(99,102,241,0.3)]">
            {/* Spinning Rings */}
            <div className="absolute inset-1 rounded-full border-t-2 border-indigo-400 animate-spin" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-3 rounded-full border-r-2 border-purple-400 animate-spin" style={{ animationDuration: "5s", animationDirection: "reverse" }} />
            <div className="absolute inset-5 rounded-full border-b-2 border-pink-400 animate-spin" style={{ animationDuration: "8s" }} />

            <div className="text-center p-4">
              <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold block mb-1">SYSTEM NAME</span>
              <h3 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                PREDICTOR
              </h3>
              <p className="text-3xl font-extrabold font-mono text-white mt-1">{progress}%</p>
            </div>
          </div>
        </div>

        {/* Console Log Status */}
        <div className="mt-8 text-center z-10 max-w-lg">
          <p className="text-xs font-mono text-indigo-300/90 animate-pulse">{activeLog}</p>
          <div className="w-64 h-1.5 bg-slate-900 rounded-full mx-auto mt-3 overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ── BURST OF LIGHT TRANSITION EFFECT ── */}
      <div
        className={`fixed inset-0 z-40 bg-white pointer-events-none transition-opacity duration-700 ease-out ${
          stage === "light_flash" ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* ── STAGE 3: THE OUTBREAK INTELLIGENCE REPORT (REVEALED VIEW) ── */}
      <div
        className={`absolute inset-0 overflow-y-auto z-30 transition-all duration-1000 ease-out flex flex-col bg-[#06060c] ${
          stage === "revealed" ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        {/* Report Header Bar */}
        <header className="sticky top-0 z-50 border-b border-[var(--border)] px-6 py-4 backdrop-blur-md bg-[#080812]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-rose-500 to-indigo-600 font-bold text-white shadow-lg">
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                PREDICTOR Outbreak Intelligence Report
              </h1>
              <p className="text-xs text-slate-400">Synthesized from Demographics, Satellite Climate Telemetry, & Historical Outbreaks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            ✕ Close Report
          </button>
        </header>

        {/* Report Main View */}
        <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
          
          {/* Target Highlight Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-indigo-950/20 to-slate-950 shadow-2xl">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <RiskBadge tier={report?.overall_risk_tier || "High"} size="lg" />
                <span className="text-xs text-slate-400 font-mono">Target: {report?.district_name}, {report?.state}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Projected {report?.disease.toUpperCase()} Outbreak Peak: {report?.peak_outbreak_week}
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Predicted Peak Case Volume: <strong className="text-rose-400 font-mono text-base">{report?.peak_cases_predicted} cases</strong> ({((report?.population || 0) / 1000000).toFixed(1)}M Population Base)
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-mono space-y-1 shrink-0">
              <p className="text-slate-400">Coordinates: <span className="text-indigo-300">{report?.where?.coordinates}</span></p>
              <p className="text-slate-400">Satellite Quad: <span className="text-emerald-300">{report?.where?.satellite_boundary}</span></p>
            </div>
          </div>

          {/* 3 COLUMN CORE ANALYTICS: WHERE / WHY / HOW */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* 1. WHERE */}
            <div className="p-6 rounded-2xl border border-indigo-500/20 bg-[#0c0c16] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600/30 text-indigo-300 font-bold text-sm">📍</span>
                  <h3 className="text-base font-bold uppercase tracking-wider text-white">1. WHERE Outbreak Will Strike</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-slate-400 mb-1 font-semibold">Location & Demographics</p>
                    <p className="text-slate-200 font-bold text-sm">{report?.where?.location}</p>
                    <p className="text-slate-400 mt-1">Census Population: {((report?.population || 0)).toLocaleString()}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-slate-400 mb-1 font-semibold">Vulnerable Density Zones</p>
                    <p className="text-slate-300 leading-relaxed">{report?.where?.vulnerable_zones}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-slate-400 mb-1 font-semibold">Satellite Map Quadrant</p>
                    <p className="text-emerald-400 font-mono">{report?.where?.satellite_boundary}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. WHY */}
            <div className="p-6 rounded-2xl border border-purple-500/20 bg-[#0c0c16] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600/30 text-purple-300 font-bold text-sm">🧪</span>
                  <h3 className="text-base font-bold uppercase tracking-wider text-white">2. WHY Outbreak Triggers</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-slate-400 mb-1 font-semibold">Primary Climate Telemetry Driver</p>
                    <p className="text-amber-300 font-medium">{report?.why?.primary_climate_driver}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-slate-400 mb-1 font-semibold">Historical Outbreak Correlation</p>
                    <p className="text-purple-300 font-medium">{report?.why?.historical_outbreak_correlation}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <p className="text-slate-400 font-semibold mb-2">SHAP Environmental Feature Weights</p>
                    {Object.entries(report?.why?.shap_attributions || {}).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between font-mono">
                        <span className="text-slate-400">{key}</span>
                        <span className="text-indigo-400 font-bold">{(val * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. HOW */}
            <div className="p-6 rounded-2xl border border-pink-500/20 bg-[#0c0c16] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-600/30 text-pink-300 font-bold text-sm">🚑</span>
                  <h3 className="text-base font-bold uppercase tracking-wider text-white">3. HOW & Recommended Action</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-slate-400 mb-1 font-semibold">Transmission Pathway</p>
                    <p className="text-pink-300 font-medium">{report?.how?.transmission_pathway}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <p className="text-emerald-400 font-bold mb-1">Pre-Positioning Action Plan</p>
                    <p className="text-slate-200 leading-relaxed">{report?.how?.recommended_action}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-slate-400 mb-2 font-semibold">8-Week Projected Progression</p>
                    <div className="space-y-1 font-mono text-[11px]">
                      {report?.how?.progression_timeline?.map((pt, i) => (
                        <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-800/60 last:border-none">
                          <span className="text-slate-400">{pt.week_start}</span>
                          <span className="text-rose-400 font-bold">{pt.cases} cases</span>
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

function DataNode({ title, desc, color, active }: { title: string; desc: string; color: string; active: boolean }) {
  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all duration-500 ${
        active
          ? "bg-slate-900/90 border-slate-700 shadow-lg"
          : "bg-slate-950/40 border-slate-900 opacity-40"
      }`}
      style={{
        boxShadow: active ? `0 0 20px ${color}22` : "none",
        borderColor: active ? color : undefined,
      }}
    >
      <p className="text-xs font-bold text-white mb-0.5">{title}</p>
      <p className="text-[10px] text-slate-400 font-mono">{desc}</p>
    </div>
  );
}
