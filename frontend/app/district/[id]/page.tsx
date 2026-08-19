"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchForecast,
  fetchHistory,
  fetchDistricts,
  fetchShapFeatures,
  District,
  ForecastPoint,
  HistoricalPoint,
  ShapResponse,
} from "@/lib/api-client";
import ForecastChart from "@/app/components/ForecastChart";
import RiskBadge from "@/app/components/RiskBadge";
import NewsSignalPanel from "@/app/components/NewsSignalPanel";
import PrecautionPanel from "@/app/components/PrecautionPanel";
import GovtBenefitsPanel from "@/app/components/GovtBenefitsPanel";

export default function DistrictDetail() {
  const params = useParams();

  const [allDistricts, setAllDistricts] = useState<District[]>([]);
  const [districtId, setDistrictId] = useState<string>(
    typeof params?.id === "string" ? params.id.toUpperCase() : ""
  );

  const [district, setDistrict] = useState<District | null>(null);
  const [disease, setDisease] = useState<string>("dengue");
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [shapData, setShapData] = useState<ShapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setHistoryError(false);

    const loadData = async () => {
      try {
        const dList = await fetchDistricts();
        setAllDistricts(dList);
        
        let currentDistrictId = districtId;
        if (!currentDistrictId && dList.length > 0) {
          currentDistrictId = dList[0].id.toUpperCase();
          setDistrictId(currentDistrictId);
        }

        if (!currentDistrictId) return;

        const fData = await fetchForecast(currentDistrictId, disease);
        const found = dList.find((d) => d.id.toUpperCase() === currentDistrictId);
        setDistrict(found || { id: currentDistrictId, name: currentDistrictId, state: "India", lat: 0, lon: 0, population: 1000000 });
        setForecast(fData);
      } catch {
        // forecast/district list errors handled by empty states
      }

      if (!districtId) return; // avoid fetching history if id is empty

      try {
        const hData = await fetchHistory(districtId, disease);
        setHistory(hData);
      } catch {
        setHistory([]);
        setHistoryError(true);
      }

      try {
        const sData = await fetchShapFeatures(districtId, disease);
        setShapData(sData);
      } catch {
        setShapData(null);
      }

      setLoading(false);
    };
    loadData();
  }, [districtId, disease]);

  const currentRisk = forecast.length > 0 ? forecast[0].risk_tier : "Low";

  function getInfluenceColor(pct: number): string {
    if (pct >= 25) return "var(--bp-cyan)";
    if (pct >= 15) return "var(--bp-white-soft)";
    return "var(--bp-white-muted)";
  }

  function getInfluenceLabel(pct: number): string {
    if (pct >= 25) return "High Influence";
    if (pct >= 15) return "Moderate Influence";
    return "Contributing Factor";
  }

  return (
    <div className="flex flex-col min-h-screen text-[var(--bp-white-soft)] font-mono">
      {/* ── Header ────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--bp-line-faint)] px-6 py-4 backdrop-blur-md" style={{ background: 'rgba(0, 30, 60, 0.9)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 border border-[var(--bp-line-faint)] flex items-center justify-center text-lg hover:border-[var(--bp-cyan)] transition" style={{ color: 'var(--bp-white-soft)' }}>
              ←
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--bp-white-soft)' }}>
                  <span className="bp-serial">[DST-01]</span>
                  <select 
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    className="bg-transparent border-none text-sm font-bold uppercase tracking-widest focus:ring-0 cursor-pointer hover:text-[var(--bp-cyan)] transition-colors font-mono"
                    style={{ color: 'var(--bp-white-soft)' }}
                  >
                    {allDistricts.map(d => (
                      <option key={d.id} value={d.id.toUpperCase()} style={{ background: '#002244' }}>
                        {d.name}
                      </option>
                    ))}
                    {!allDistricts.find(d => d.id.toUpperCase() === districtId) && (
                      <option value={districtId} style={{ background: '#002244' }}>{district?.name || districtId}</option>
                    )}
                  </select>
                  FORECAST
                </h1>
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>{district?.state || "India"} • Pop: {((district?.population || 0) / 1000000).toFixed(1)}M</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/proof?district_id=${districtId}&disease=${disease}`} className="bp-btn bp-btn-active text-[9px]">
              🎯 BACKTEST PROOF
            </Link>
            {["dengue", "malaria", "add"].map((dis) => (
              <button
                key={dis}
                onClick={() => setDisease(dis)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition border font-mono ${
                  disease === dis
                    ? "border-[var(--bp-cyan)] text-[var(--bp-cyan)] bg-[rgba(0,255,255,0.08)]"
                    : "border-[var(--bp-line-faint)] text-[var(--bp-white-faint)] hover:text-[var(--bp-white-muted)]"
                }`}
              >
                {dis}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ───────────────────────────── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* District Summary Header with Provenance */}
        <div className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <RiskBadge tier={currentRisk} size="lg" />
                <span className="bp-coord">8-Week Horizon ({disease.toUpperCase()})</span>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>
                Climate-corrected residual modeling incorporating NASA POWER rainfall, temperature, and historical IDSP surveillance baselines.
              </p>
            </div>
            <div className="px-3 py-2 border border-[var(--bp-line-faint)] font-mono text-[9px] space-y-0.5 shrink-0" style={{ color: 'var(--bp-white-faint)' }}>
              <p>Model: <span style={{ color: 'var(--bp-cyan)' }}>v2.0-comprehensive-hgb-xgb</span></p>
              <p>Cutoff: <span style={{ color: 'var(--bp-cyan)' }}>Dec 2024</span></p>
              <p>Evaluation: <span style={{ color: 'var(--bp-white-muted)' }}>Backtested (MAE 2.1-4.3)</span></p>
            </div>
          </div>
        </div>

        {/* 1. OBSERVED SURVEILLANCE BASELINE & 2. ENVIRONMENTAL CLIMATE SIGNALS */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="blueprint-card p-6">
            <div className="bp-corners">
              <span className="corner-tr">+</span>
              <span className="corner-bl">+</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                <span className="bp-serial">[SEC-01]</span> Observed Surveillance Baseline (IDSP)
              </h3>
              <span className="bp-coord">Source: `case_data` DB table</span>
            </div>
            {loading ? (
              <div className="h-[260px] flex items-center justify-center text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>Loading historical data...</div>
            ) : history.length > 0 ? (
              <div className="space-y-2 font-mono text-[10px] max-h-[260px] overflow-y-auto pr-1">
                {history.slice(-10).map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 border border-[var(--bp-line-faint)]">
                    <span style={{ color: 'var(--bp-white-faint)' }}>{h.week_start}</span>
                    <span className="font-bold" style={{ color: 'var(--bp-cyan)' }}>{h.cases} cases</span>
                    <span style={{ color: 'var(--bp-white-faint)' }}>{h.rainfall_mm ?? 0} mm rain</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-[10px] gap-2" style={{ color: 'var(--bp-white-faint)' }}>
                <span className="text-2xl">📋</span>
                <p className="font-bold">No historical surveillance data available</p>
                <p className="text-center max-w-xs">
                  {historyError
                    ? "Historical case data unavailable from API server."
                    : "No IDSP case records found for this district and disease combination."}
                </p>
              </div>
            )}
          </div>

          <div className="blueprint-card p-6 flex flex-col justify-between">
            <div className="bp-corners">
              <span className="corner-tr">+</span>
              <span className="corner-bl">+</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                  <span className="bp-serial">[SEC-02]</span> Environmental Climate Drivers (NASA POWER)
                </h3>
                <span className="bp-coord">Model Inference (SHAP)</span>
              </div>
              <p className="text-[10px] mb-4" style={{ color: 'var(--bp-white-faint)' }}>
                SHAP feature attribution identifies top environmental indicators driving vector and waterborne transmission in {district?.name}.
              </p>
              
              {shapData && shapData.features.length > 0 ? (
                <div className="space-y-2 text-[10px]">
                  {shapData.features.slice(0, 4).map((feat, i) => (
                    <div
                      key={feat.feature}
                      className={`flex items-center justify-between p-2.5 border ${
                        i === 0
                          ? "border-[var(--bp-cyan-dim)]"
                          : "border-[var(--bp-line-faint)]"
                      }`}
                      style={i === 0 ? { background: 'rgba(0,255,255,0.03)' } : {}}
                    >
                      <span style={{ color: 'var(--bp-white-muted)' }}>{feat.label}</span>
                      <span className="font-mono font-bold" style={{ color: getInfluenceColor(feat.percentage) }}>
                        {getInfluenceLabel(feat.percentage)} (+{feat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[140px] text-[10px] gap-2" style={{ color: 'var(--bp-white-faint)' }}>
                  <span className="text-2xl">🧪</span>
                  <p className="font-bold">SHAP feature data unavailable</p>
                  <p className="text-center">Ensure backend API is running to load feature attributions.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--bp-line-faint)] text-[9px] font-mono" style={{ color: 'var(--bp-white-faint)' }}>
              Source: NASA POWER API • Telemetry lag window: 2 weeks
            </div>
          </div>
        </div>

        {/* 3. ML MODEL FORECAST (8-WEEK PROJECTION CHART) */}
        <div className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
                <span className="bp-serial">[SEC-03]</span> ML Outbreak Forecast Matrix (8-Week Bounded Horizon)
              </h3>
              <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>Confidence interval bounded by model variance.</p>
            </div>
            <span className="bp-coord">Model: v2.0-comprehensive-hgb-xgb</span>
          </div>

          {loading ? (
            <div className="h-[320px] flex items-center justify-center" style={{ color: 'var(--bp-white-faint)' }}>Loading forecast...</div>
          ) : forecast.length > 0 ? (
            <ForecastChart data={forecast} />
          ) : (
            <div className="h-[320px] flex items-center justify-center" style={{ color: 'var(--bp-white-faint)' }}>No predictions recorded for these parameters.</div>
          )}
        </div>

        {/* ── Regional News Signals (Phase 7) ── */}
        <NewsSignalPanel districtId={districtId} districtName={district?.name} />

        {/* 4. PRECAUTIONARY MEASURES */}
        <PrecautionPanel diseaseId={disease} />

        {/* 5. GOVT BENEFITS & COST IMPACT */}
        <GovtBenefitsPanel 
          diseaseId={disease} 
          projectedCases={forecast.reduce((sum, point) => sum + point.predicted_cases, 0)} 
        />

      </main>
    </div>
  );
}
