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
    if (pct >= 25) return "text-emerald-400";
    if (pct >= 15) return "text-amber-400";
    return "text-indigo-400";
  }

  function getInfluenceLabel(pct: number): string {
    if (pct >= 25) return "High Influence";
    if (pct >= 15) return "Moderate Influence";
    return "Contributing Factor";
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#07070b] text-slate-100">
      {/* ── Header ────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border)] px-6 py-4 backdrop-blur-md bg-[#09090f]/80">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition">
              ←
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <select 
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    className="bg-transparent border-none text-xl font-bold text-white focus:ring-0 cursor-pointer hover:text-indigo-300 transition-colors"
                  >
                    {allDistricts.map(d => (
                      <option key={d.id} value={d.id.toUpperCase()} className="bg-slate-900 text-sm">
                        {d.name}
                      </option>
                    ))}
                    {!allDistricts.find(d => d.id.toUpperCase() === districtId) && (
                      <option value={districtId} className="bg-slate-900 text-sm">{district?.name || districtId}</option>
                    )}
                  </select>
                  Forecast
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">{district?.state || "India"} • Pop: {((district?.population || 0) / 1000000).toFixed(1)}M</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/proof?district_id=${districtId}&disease=${disease}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition">
              🎯 Backtest Proof
            </Link>
            {["dengue", "malaria", "add"].map((dis) => (
              <button
                key={dis}
                onClick={() => setDisease(dis)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition border ${
                  disease === dis
                    ? "bg-indigo-600 text-white border-indigo-400"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-800 bg-[#0d0d16]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <RiskBadge tier={currentRisk} size="lg" />
              <span className="text-xs text-slate-400 font-mono">8-Week Horizon ({disease.toUpperCase()})</span>
            </div>
            <p className="text-sm text-slate-300">
              Climate-corrected residual modeling incorporating NASA POWER rainfall, temperature, and historical IDSP surveillance baselines.
            </p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-400 space-y-0.5 shrink-0">
            <p>Model: <span className="text-indigo-300">v2.0-comprehensive-hgb-xgb</span></p>
            <p>Cutoff: <span className="text-emerald-400">Dec 2024</span></p>
            <p>Evaluation: <span className="text-purple-300">Backtested (MAE 2.1-4.3)</span></p>
          </div>
        </div>

        {/* 1. OBSERVED SURVEILLANCE BASELINE & 2. ENVIRONMENTAL CLIMATE SIGNALS */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                1. Observed Surveillance Baseline (IDSP)
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Source: `case_data` DB table</span>
            </div>
            {loading ? (
              <div className="h-[260px] flex items-center justify-center text-slate-500 text-xs">Loading historical data...</div>
            ) : history.length > 0 ? (
              <div className="space-y-3 font-mono text-xs max-h-[260px] overflow-y-auto pr-1">
                {history.slice(-10).map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">{h.week_start}</span>
                    <span className="text-indigo-400 font-bold">{h.cases} cases</span>
                    <span className="text-slate-500">{h.rainfall_mm ?? 0} mm rain</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <span className="text-2xl">📋</span>
                <p className="font-semibold">No historical surveillance data available</p>
                <p className="text-slate-600 text-center max-w-xs">
                  {historyError
                    ? "Historical case data unavailable from API server."
                    : "No IDSP case records found for this district and disease combination."}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  2. Environmental Climate Drivers (NASA POWER)
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Model Inference (SHAP)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                SHAP feature attribution identifies top environmental indicators driving vector and waterborne transmission in {district?.name}.
              </p>
              
              {shapData && shapData.features.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {shapData.features.slice(0, 4).map((feat, i) => (
                    <div
                      key={feat.feature}
                      className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        i === 0
                          ? "bg-indigo-950/30 border-indigo-500/20"
                          : "bg-slate-900 border-slate-800"
                      }`}
                    >
                      <span>{feat.label}</span>
                      <span className={`font-mono ${getInfluenceColor(feat.percentage)}`}>
                        {getInfluenceLabel(feat.percentage)} (+{feat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[140px] text-slate-500 text-xs gap-2">
                  <span className="text-2xl">🧪</span>
                  <p className="font-semibold">SHAP feature data unavailable</p>
                  <p className="text-slate-600 text-center">Ensure backend API is running to load feature attributions.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Source: NASA POWER API • Telemetry lag window: 2 weeks
            </div>
          </div>
        </div>

        {/* 3. ML MODEL FORECAST (8-WEEK PROJECTION CHART) */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                3. ML Outbreak Forecast Matrix (8-Week Bounded Horizon)
              </h3>
              <p className="text-xs text-slate-400">Confidence interval bounded by model variance.</p>
            </div>
            <span className="text-xs text-indigo-400 font-mono">Model Version: v2.0-comprehensive-hgb-xgb</span>
          </div>

          {loading ? (
            <div className="h-[320px] flex items-center justify-center text-slate-500">Loading forecast...</div>
          ) : forecast.length > 0 ? (
            <ForecastChart data={forecast} />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-500">No predictions recorded for these parameters.</div>
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

