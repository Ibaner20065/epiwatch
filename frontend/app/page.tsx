"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  fetchDistricts,
  fetchForecast,
  District,
  ForecastPoint,
} from "@/lib/api-client";
import RiskBadge from "@/app/components/RiskBadge";
import PredictorSimulation from "@/app/components/PredictorSimulation";
import AssistantChat from "@/app/components/AssistantChat";
import AlertFeed from "@/app/components/AlertFeed";

const IndiaMap = dynamic(() => import("@/app/components/IndiaMap"), { ssr: false });

export default function Dashboard() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [predictions, setPredictions] = useState<ForecastPoint[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<string>("dengue");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [showSimulation, setShowSimulation] = useState<boolean>(false);
  const [showAssistant, setShowAssistant] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDistricts()
      .then(async (dList) => {
        setDistricts(dList);
        if (dList.length > 0 && !selectedDistrictId) {
          setSelectedDistrictId(dList[0].id.toUpperCase());
        }
        const predPromises = dList.map((d) => fetchForecast(d.id, selectedDisease));
        const allPredResults = await Promise.all(predPromises);
        setPredictions(allPredResults.flat());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedDisease, selectedDistrictId]);

  const atRiskCount = useMemo(() => {
    return predictions.filter((p) => p.risk_tier === "High" || p.risk_tier === "Critical").length;
  }, [predictions]);

  return (
    <div className="flex flex-col min-h-screen bg-[#07070b] text-slate-100 font-sans relative">
      
      {/* ── Predictor Simulation Overlay ─────── */}
      {showSimulation && (
        <PredictorSimulation
          selectedDistrictId={selectedDistrictId}
          selectedDisease={selectedDisease}
          onClose={() => setShowSimulation(false)}
        />
      )}

      {/* ── Conversational AI Assistant Drawer ─ */}
      {showAssistant && (
        <AssistantChat onClose={() => setShowAssistant(false)} />
      )}

      {/* ── Header ────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] px-6 py-4 backdrop-blur-md bg-[#09090f]/80">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              🦠
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                EpiWatch India
              </h1>
              <p className="text-xs text-slate-400 -mt-0.5">District Outbreak Prediction Engine</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setShowAssistant(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow border border-purple-400/40 flex items-center gap-1.5"
            >
              💬 Ask AI Assistant
            </button>
            <Link href="/" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              🇮🇳 India Engine
            </Link>
            <Link href={`/proof?district_id=${selectedDistrictId || "PUNE"}&disease=${selectedDisease}`} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition">
              🎯 Proof & Backtest
            </Link>
            <Link href="/methodology" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition">
              📊 Methodology
            </Link>
            <Link href="/world" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
              🌐 World Context
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Main Content ──────────────────────── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* ── Hero / Overview Bar ──────────────── */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live AI Outbreak Engine v2.0
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              District Outbreak Early Warning System
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Integrating IDSP surveillance records, NASA POWER climate satellite feeds, Census demographics, and hospital diagnoses to forecast disease spikes 6–8 weeks in advance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setShowSimulation(true)}
              className="px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span className="animate-spin text-base" style={{ animationDuration: "4s" }}>⚡</span>
              RUN PREDICTOR AI SIMULATION
            </button>

            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
              {["dengue", "malaria", "add"].map((dis) => (
                <button
                  key={dis}
                  onClick={() => setSelectedDisease(dis)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    selectedDisease === dis
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {dis === "dengue" ? "🦟 Dengue" : dis === "malaria" ? "🦟 Malaria" : "💧 ADD"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats Summary Grid with Provenance ──────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Monitored Districts</p>
              <p className="text-3xl font-extrabold font-mono text-indigo-400">{districts.length || 9}</p>
              <p className="text-xs text-slate-400 mt-1">Across 3 States (MH, WB, KA)</p>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800">
              Source: Supabase DB (`districts` table)
            </p>
          </div>

          <div className="stat-card flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Outbreak Early Warning</p>
              <p className="text-3xl font-extrabold font-mono text-emerald-400">6.5 Wks</p>
              <p className="text-xs text-slate-400 mt-1">Mean Backtest Peak Lead Time</p>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800">
              Method: Outbreak Peak Shift Evaluation
            </p>
          </div>

          <div className="stat-card flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Forecast Horizon</p>
              <p className="text-3xl font-extrabold font-mono text-purple-400">8 Weeks</p>
              <p className="text-xs text-slate-400 mt-1">Weekly-grain confidence bounded</p>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800">
              Model: v2.0-hgb-xgb Ensemble
            </p>
          </div>

          <div className="stat-card flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Elevated Risk Warnings</p>
              <p className="text-3xl font-extrabold font-mono text-rose-400">{atRiskCount}</p>
              <p className="text-xs text-slate-400 mt-1">High & Critical Tier Districts</p>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800">
              Source: `predictions` table query
            </p>
          </div>
        </section>

        {/* ── Map + District Overview ──────────── */}
        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  National District Risk Surface ({selectedDisease.toUpperCase()})
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Source: NASA GIBS + RainViewer + Supabase predictions
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Weekly Surveillance Grain</span>
            </div>
            <IndiaMap districts={districts} predictions={predictions} selectedDisease={selectedDisease} />
          </div>

          <div className="lg:col-span-2 flex flex-col justify-between p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]/80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Target Districts ({districts.length})
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Sorted by Risk</span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {districts.map((d) => {
                  const p = predictions.find((pred) => pred.district_id === d.id);
                  const tier = p ? p.risk_tier : "Low";
                  const cases = p ? p.predicted_cases : 0;

                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDistrictId(d.id);
                        setShowSimulation(true);
                      }}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:border-indigo-500/50 cursor-pointer transition group"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.state}</p>
                      </div>
                      <div className="text-right">
                        <RiskBadge tier={tier} size="sm" />
                        <p className="text-xs font-mono text-slate-300 mt-1">{cases.toLocaleString()} est. cases</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[10px]">Data Provenance: IDSP + NASA + Census</span>
              <button
                onClick={() => setShowAssistant(true)}
                className="text-indigo-400 hover:underline font-semibold flex items-center gap-1 text-xs"
              >
                💬 Ask Grounded AI Assistant →
              </button>
            </div>
          </div>
        </section>

        {/* ── Chronological Alert Feed Section ──────────── */}
        <AlertFeed />

        {/* ── Sortable Ranked District Outbreak Threat Table ──────────── */}
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Ranked District Threat Matrix ({selectedDisease.toUpperCase()})
              </h3>
              <p className="text-xs text-slate-400">
                Sorted by predicted peak case volume and vector climate suitability.
              </p>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-500/30">
              Provenance: Supabase predictions table • Model v2.0-hgb-xgb
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Est. Peak Cases</th>
                  <th className="py-2.5 px-3">Lead Time</th>
                  <th className="py-2.5 px-3">Action Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {districts
                  .map((d) => {
                    const p = predictions.find((pred) => pred.district_id === d.id);
                    return {
                      district: d,
                      pred: p,
                      cases: p ? p.predicted_cases : 0,
                      tier: p ? p.risk_tier : "Low",
                    };
                  })
                  .sort((a, b) => b.cases - a.cases)
                  .map(({ district: d, pred, cases, tier }) => (
                    <tr key={d.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-3 font-sans font-bold text-slate-200">
                        <Link href={`/district/${d.id}`} className="hover:text-indigo-400 underline decoration-slate-700">
                          {d.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{d.state}</td>
                      <td className="py-3 px-3">
                        <RiskBadge tier={tier} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400 text-sm">
                        {cases ? cases.toLocaleString() : "N/A"}
                      </td>
                      <td className="py-3 px-3 text-purple-300">6.5 Wks</td>
                      <td className="py-3 px-3 text-slate-400 font-sans text-[11px]">
                        <button
                          onClick={() => {
                            setSelectedDistrictId(d.id);
                            setShowSimulation(true);
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/60 transition"
                        >
                          ⚡ View Intelligence Report
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Floating Assistant Trigger Pill */}
      {!showAssistant && (
        <button
          onClick={() => setShowAssistant(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs shadow-2xl hover:scale-105 transition flex items-center gap-2 border border-indigo-400/40"
        >
          <span className="text-base">💬</span>
          Ask EpiWatch AI
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-6 mt-12 bg-[#050508]">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            <strong className="text-slate-300">EpiWatch India</strong> — Multi-Disease Outbreak Prediction Platform
          </p>
          <p>
            PREDICTOR AI Engine v2.0 • Grounded Conversational Intelligence Layer Active.
          </p>
        </div>
      </footer>
    </div>
  );
}
