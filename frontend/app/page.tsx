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
    <div className="flex flex-col min-h-screen text-[var(--text-primary)] font-mono relative">
      
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
      <header className="sticky top-0 z-40 border-b border-[var(--border)] px-6 py-4 backdrop-blur-md" style={{ background: 'rgba(0, 30, 60, 0.9)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-dashed border-[var(--bp-cyan)] flex items-center justify-center text-xl" style={{ color: 'var(--bp-cyan)' }}>
              🌾
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: 'var(--bp-cyan)' }}>
                EpiWatch GramRaksha
              </h1>
              <p className="text-[10px] tracking-wider" style={{ color: 'var(--bp-white-muted)' }}>
                <span className="bp-serial">[SYS-001]</span> Rural One-Health &amp; Outbreak Prediction Engine
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAssistant(true)}
              className="bp-btn bp-btn-active"
            >
              💬 ASK AI ASSISTANT
            </button>
            <Link href="/" className="bp-btn bp-btn-active">
              🇮🇳 RURAL HEALTH
            </Link>
            <Link href="/livestock" className="bp-btn bp-btn-active" style={{ borderColor: '#d4af37', color: '#d4af37' }}>
              🐄 PASHURAKSHA (356 TEHSILS)
            </Link>
            <Link href="/livestock/report" className="bp-btn" style={{ borderColor: '#00d4aa', color: '#00d4aa' }}>
              📝 VILLAGE FIELD REPORT
            </Link>
            <Link href="/oa" className="bp-btn" style={{ borderColor: '#4fc3f7', color: '#4fc3f7' }}>
              🦵 FARMER OA SCREENING
            </Link>
            <Link href={`/proof?district_id=${selectedDistrictId || "PUNE"}&disease=${selectedDisease}`} className="bp-btn">
              🎯 PROOF &amp; BACKTEST
            </Link>
            <Link href="/methodology" className="bp-btn">
              📊 METHODOLOGY
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Main Content ──────────────────────── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* ── Hero / Overview Bar ──────────────── */}
        <section className="blueprint-card p-6 animate-fade-up">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-[var(--bp-cyan)] border-dashed" style={{ color: 'var(--bp-cyan)' }}>
                  <span className="w-2 h-2 bg-[var(--bp-cyan)]" style={{ animation: 'bp-pulse 2s ease-in-out infinite' }} />
                  RURAL ONE-HEALTH DEFENSE SHIELD V2.0
                </span>
                <span className="bp-serial">[SEC-001]</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-[#d4af37]" style={{ color: '#d4af37' }}>
                  356 MAHARASHTRA TEHSILS TRACKED
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase" style={{ color: 'var(--bp-white-soft)' }}>
                Rural Epidemic Early Warning &amp; Livestock Livelihood Shield
              </h2>
              <p className="text-xs mt-1 leading-relaxed max-w-4xl" style={{ color: 'var(--bp-white-muted)' }}>
                Empowering Gram Panchayats, Primary Health Centres (PHCs), and smallholder farmers by fusing IDSP epidemiological data, 19th Livestock Census block figures, and NASA POWER climate satellite telemetry to forecast waterborne surges and animal epidemics 6–8 weeks in advance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={() => setShowSimulation(true)}
                className="bp-btn bp-btn-active flex items-center justify-center gap-2 py-3 px-4"
              >
                <span className="text-base">⚡</span>
                <span className="tracking-wider">RUN PREDICTOR SIMULATION</span>
              </button>

              <div className="flex items-center gap-1 p-1 border border-[var(--bp-line-faint)]">
                {["dengue", "malaria", "add"].map((dis) => (
                  <button
                    key={dis}
                    onClick={() => setSelectedDisease(dis)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition font-mono ${
                      selectedDisease === dis
                        ? "border border-[var(--bp-cyan)] text-[var(--bp-cyan)] bg-[rgba(0,255,255,0.08)]"
                        : "text-[var(--bp-white-muted)] hover:text-[var(--bp-white-soft)]"
                    }`}
                  >
                    {dis === "dengue" ? "🦟 DENGUE" : dis === "malaria" ? "🦟 MALARIA" : "💧 ADD"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Rural Quick-Action Command Strip ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[var(--border)] border-dashed">
            <Link href="/livestock" className="p-3 border border-[#d4af37]/40 hover:border-[#d4af37] bg-[#d4af37]/5 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#d4af37] tracking-wider">🐄 PASHURAKSHA SURVEILLANCE</span>
                <span className="text-[10px] text-[var(--bp-white-muted)]">37 Diseases →</span>
              </div>
              <p className="text-[11px] text-[var(--bp-white-muted)] mt-1">
                National MOSPI ML forecasts &amp; 34 Maharashtra district cattle/poultry trends.
              </p>
            </Link>

            <Link href="/livestock/report" className="p-3 border border-[#00d4aa]/40 hover:border-[#00d4aa] bg-[#00d4aa]/5 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00d4aa] tracking-wider">📍 PASHU SAKHI FIELD INTAKE</span>
                <span className="text-[10px] text-[var(--bp-white-muted)]">Instant AI →</span>
              </div>
              <p className="text-[11px] text-[var(--bp-white-muted)] mt-1">
                Village symptom reporting with NLP triage &amp; Marathi/Hindi voice intake.
              </p>
            </Link>

            <Link href="/livestock/lab" className="p-3 border border-[#ff6b6b]/40 hover:border-[#ff6b6b] bg-[#ff6b6b]/5 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ff6b6b] tracking-wider">🔬 5-STAGE LAB PIPELINE</span>
                <span className="text-[10px] text-[var(--bp-white-muted)]">Track →</span>
              </div>
              <p className="text-[11px] text-[var(--bp-white-muted)] mt-1">
                Sample transport, cold-chain monitoring &amp; automated outbreak alerts.
              </p>
            </Link>

            <Link href="/oa" className="p-3 border border-[#4fc3f7]/40 hover:border-[#4fc3f7] bg-[#4fc3f7]/5 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4fc3f7] tracking-wider">🦵 FARMER OA SCREENING</span>
                <span className="text-[10px] text-[var(--bp-white-muted)]">AUC 0.96 →</span>
              </div>
              <p className="text-[11px] text-[var(--bp-white-muted)] mt-1">
                WOMAC joint disability screening for rural agricultural workers.
              </p>
            </Link>
          </div>

          {/* Dimension marker */}
          <div className="bp-divider mt-4">
            <span>&lt;── 1400px ──&gt;</span>
          </div>
        </section>

        {/* ── Stats Summary Grid ──────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card flex flex-col justify-between animate-fade-up">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--bp-white-muted)' }}>
                <span className="bp-serial">[STAT-01]</span> Monitored Districts
              </p>
              <p className="text-3xl font-bold font-mono" style={{ color: 'var(--bp-cyan)' }}>{districts.length || 9}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>Across 3 States (MH, WB, KA)</p>
            </div>
            <p className="text-[9px] font-mono mt-3 pt-2 border-t border-[var(--bp-line-faint)]" style={{ color: 'var(--bp-white-faint)' }}>
              Source: Supabase DB (`districts` table)
            </p>
          </div>

          <div className="stat-card flex flex-col justify-between animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--bp-white-muted)' }}>
                <span className="bp-serial">[STAT-02]</span> Outbreak Early Warning
              </p>
              <p className="text-3xl font-bold font-mono" style={{ color: 'var(--bp-cyan)' }}>6.5 Wks</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>Mean Backtest Peak Lead Time</p>
            </div>
            <p className="text-[9px] font-mono mt-3 pt-2 border-t border-[var(--bp-line-faint)]" style={{ color: 'var(--bp-white-faint)' }}>
              Method: Outbreak Peak Shift Evaluation
            </p>
          </div>

          <div className="stat-card flex flex-col justify-between animate-fade-up" style={{ animationDelay: '160ms' }}>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--bp-white-muted)' }}>
                <span className="bp-serial">[STAT-03]</span> Forecast Horizon
              </p>
              <p className="text-3xl font-bold font-mono" style={{ color: 'var(--bp-white-soft)' }}>8 Weeks</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>Weekly-grain confidence bounded</p>
            </div>
            <p className="text-[9px] font-mono mt-3 pt-2 border-t border-[var(--bp-line-faint)]" style={{ color: 'var(--bp-white-faint)' }}>
              Model: v2.0-hgb-xgb Ensemble
            </p>
          </div>

          <div className="stat-card flex flex-col justify-between animate-fade-up" style={{ animationDelay: '240ms' }}>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--bp-white-muted)' }}>
                <span className="bp-serial">[STAT-04]</span> Elevated Risk Warnings
              </p>
              <p className="text-3xl font-bold font-mono" style={{ color: 'var(--bp-redline)' }}>{atRiskCount}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>High &amp; Critical Tier Districts</p>
            </div>
            <p className="text-[9px] font-mono mt-3 pt-2 border-t border-[var(--bp-line-faint)]" style={{ color: 'var(--bp-white-faint)' }}>
              Source: `predictions` table query
            </p>
          </div>
        </section>

        {/* ── Map + District Overview ──────────── */}
        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                  <span className="bp-serial">[MAP-01]</span> National District Risk Surface ({selectedDisease.toUpperCase()})
                </h3>
                <p className="text-[9px] font-mono" style={{ color: 'var(--bp-white-faint)' }}>
                  Source: NASA GIBS + RainViewer + Supabase predictions
                </p>
              </div>
              <span className="bp-coord">Weekly Surveillance Grain</span>
            </div>
            <IndiaMap districts={districts} predictions={predictions} selectedDisease={selectedDisease} />
          </div>

          <div className="lg:col-span-2 flex flex-col justify-between p-6 blueprint-card">
            <div className="bp-corners">
              <span className="corner-tr">+</span>
              <span className="corner-bl">+</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                  <span className="bp-serial">[LIST-01]</span> Target Districts ({districts.length})
                </h3>
                <span className="bp-coord">Sorted by Risk</span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                {districts.map((d, idx) => {
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
                      className="flex items-center justify-between p-3 border border-[var(--bp-line-faint)] hover:border-[var(--bp-cyan-dim)] cursor-pointer transition group"
                    >
                      <div>
                        <p className="text-xs font-bold group-hover:text-[var(--bp-cyan)] transition" style={{ color: 'var(--bp-white-soft)' }}>
                          <span className="bp-serial mr-1">[D-{String(idx + 1).padStart(2, '0')}]</span>
                          {d.name}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>{d.state}</p>
                      </div>
                      <div className="text-right">
                        <RiskBadge tier={tier} size="sm" />
                        <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--bp-white-muted)' }}>{cases.toLocaleString()} est. cases</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--bp-line-faint)] flex items-center justify-between text-[10px]">
              <span className="bp-coord">Data Provenance: IDSP + NASA + Census</span>
              <button
                onClick={() => setShowAssistant(true)}
                className="bp-btn text-[9px]"
              >
                💬 ASK AI ASSISTANT →
              </button>
            </div>
          </div>
        </section>

        {/* ── Chronological Alert Feed Section ──────────── */}
        <AlertFeed />

        {/* ── Sortable Ranked District Outbreak Threat Table ──────────── */}
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                <span className="bp-serial">[TBL-01]</span> Ranked District Threat Matrix ({selectedDisease.toUpperCase()})
              </h3>
              <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>
                Sorted by predicted peak case volume and vector climate suitability.
              </p>
            </div>
            <span className="bp-coord px-2 py-1 border border-[var(--bp-line-faint)]">
              Provenance: Supabase predictions • Model v2.0-hgb-xgb
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-[var(--bp-line-faint)] text-left" style={{ color: 'var(--bp-white-muted)' }}>
                  <th className="py-2.5 px-3">DISTRICT</th>
                  <th className="py-2.5 px-3">STATE</th>
                  <th className="py-2.5 px-3">RISK TIER</th>
                  <th className="py-2.5 px-3">EST. PEAK CASES</th>
                  <th className="py-2.5 px-3">LEAD TIME</th>
                  <th className="py-2.5 px-3">ACTION PLAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bp-line-faint)]">
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
                    <tr key={d.id} className="hover:bg-[rgba(0,255,255,0.03)] transition">
                      <td className="py-3 px-3 font-bold" style={{ color: 'var(--bp-white-soft)' }}>
                        <Link href={`/district/${d.id}`} className="hover:text-[var(--bp-cyan)] border-b border-dashed border-[var(--bp-line-faint)]">
                          {d.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3" style={{ color: 'var(--bp-white-faint)' }}>{d.state}</td>
                      <td className="py-3 px-3">
                        <RiskBadge tier={tier} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-bold text-sm" style={{ color: 'var(--bp-cyan)' }}>
                        {cases ? cases.toLocaleString() : "N/A"}
                      </td>
                      <td className="py-3 px-3" style={{ color: 'var(--bp-white-muted)' }}>6.5 Wks</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            setSelectedDistrictId(d.id);
                            setShowSimulation(true);
                          }}
                          className="bp-btn text-[9px]"
                        >
                          ⚡ VIEW INTEL REPORT
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Floating Assistant Trigger */}
      {!showAssistant && (
        <button
          onClick={() => setShowAssistant(true)}
          className="fixed bottom-6 right-6 z-40 bp-btn bp-btn-active px-4 py-3 text-xs shadow-lg"
          style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)' }}
        >
          <span className="text-base">💬</span>
          ASK EPIWATCH AI
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--bp-line-faint)] px-6 py-6 mt-12" style={{ background: 'rgba(0, 20, 40, 0.8)' }}>
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono" style={{ color: 'var(--bp-white-faint)' }}>
          <p>
            <strong style={{ color: 'var(--bp-cyan)' }}>EPIWATCH INDIA</strong> — Multi-Disease Outbreak Prediction Platform
          </p>
          <p className="bp-serial">
            PREDICTOR AI ENGINE V2.0 • GROUNDED INTELLIGENCE LAYER ACTIVE
          </p>
        </div>
        <div className="bp-divider max-w-[1400px] mx-auto mt-3">
          <span>&lt;── BLUEPRINT SYSTEM V1.0 ──&gt;</span>
        </div>
      </footer>
    </div>
  );
}
