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
        setDistrict(
          found || {
            id: currentDistrictId,
            name: currentDistrictId,
            state: "India",
            lat: 0,
            lon: 0,
            population: 1000000,
          }
        );
        setForecast(fData);
      } catch {
        // forecast/district list errors handled by empty states
      }

      if (!districtId) return;

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
    if (pct >= 25) return "var(--brand-start)";
    if (pct >= 15) return "var(--fg)";
    return "var(--muted)";
  }

  return (
    <div className="flex flex-col min-h-dvh" style={{ fontFamily: "var(--font-sans)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 px-6 py-3.5"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px var(--border)",
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="ew-btn-secondary text-sm no-underline"
              style={{ width: 36, height: 36, padding: 0, borderRadius: "var(--radius-md)" }}
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--fg)" }}>
                  <select
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    className="ew-select bg-transparent text-base font-bold cursor-pointer"
                    style={{ border: "none", padding: 0, width: "auto", color: "var(--fg)" }}
                  >
                    {allDistricts.map((d) => (
                      <option key={d.id} value={d.id.toUpperCase()}>
                        {d.name}
                      </option>
                    ))}
                    {!allDistricts.find((d) => d.id.toUpperCase() === districtId) && (
                      <option value={districtId}>{district?.name || districtId}</option>
                    )}
                  </select>
                  <span className="ew-eyebrow">Outbreak Forecast</span>
                </h1>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {district?.state || "India"} • Pop: {((district?.population || 0) / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/proof?district_id=${districtId}&disease=${disease}`}
              className="ew-btn-primary text-xs no-underline font-semibold"
              style={{ height: 36, padding: "0 14px", borderRadius: "var(--radius-md)" }}
            >
              🎯 Backtest Proof
            </Link>
            {/* FR-9 Visible Link to Methodology */}
            <Link
              href="/methodology"
              className="ew-btn-secondary text-xs no-underline"
              style={{ height: 36, padding: "0 12px", borderRadius: "var(--radius-md)" }}
            >
              📊 Methodology (FR-9)
            </Link>

            {/* Disease Filter Tabs (t-tabs-sliding) */}
            <div className="t-tabs-sliding p-1" style={{ background: "var(--surface-muted)" }}>
              {["dengue", "malaria", "add"].map((dis) => (
                <button
                  key={dis}
                  onClick={() => setDisease(dis)}
                  className="px-3 py-1 text-[11px] font-semibold rounded-full transition-all border-none cursor-pointer"
                  style={{
                    background: disease === dis ? "var(--surface)" : "transparent",
                    color: disease === dis ? "var(--accent)" : "var(--muted)",
                    boxShadow: disease === dis ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {dis.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* District Summary */}
        <div className="ew-card p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <RiskBadge tier={currentRisk} size="lg" />
                <span className="ew-eyebrow">8-Week Horizon ({disease.toUpperCase()})</span>
              </div>
              <p className="text-sm" style={{ color: "var(--fg-2)" }}>
                Climate-corrected residual modeling incorporating NASA POWER rainfall, temperature, and historical IDSP surveillance baselines.
              </p>
            </div>
            <div
              className="p-4 rounded-lg text-xs space-y-1 shrink-0"
              style={{ background: "var(--surface-muted)", boxShadow: "var(--shadow-border)" }}
            >
              <p className="ew-data-sm">
                Model: <span style={{ color: "var(--brand-start)" }}>v2.0-comprehensive-hgb-xgb</span>
              </p>
              <p className="ew-data-sm">
                Cutoff: <span style={{ color: "var(--brand-start)" }}>Dec 2024</span>
              </p>
              <p className="ew-data-sm">
                Evaluation: <span>Backtested (MAE 2.1-4.3)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Grid: Surveillance + SHAP Drivers */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="ew-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="ew-eyebrow">Observed Surveillance</span>
                <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--fg)" }}>
                  IDSP Baseline
                </h3>
              </div>
              <span className="ew-data-sm" style={{ fontSize: 10 }}>
                Source: case_data DB
              </span>
            </div>
            {loading ? (
              <div className="h-[260px] flex items-center justify-center">
                <div className="t-skeleton-reveal w-48 h-4" />
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-2 text-sm max-h-[260px] overflow-y-auto pr-1">
                {history.slice(-10).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "var(--surface-muted)", boxShadow: "var(--shadow-border)" }}
                  >
                    <span className="ew-data-sm">{h.week_start}</span>
                    <span className="ew-data-sm font-semibold" style={{ color: "var(--observed-data)" }}>
                      {h.cases} cases
                    </span>
                    <span className="ew-data-sm">{h.rainfall_mm ?? 0} mm rain</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center gap-2" style={{ color: "var(--muted)" }}>
                <span className="text-2xl">📋</span>
                <p className="text-sm font-medium">No historical surveillance data available</p>
                <p className="text-xs text-center max-w-xs">
                  {historyError
                    ? "Historical case data unavailable from API server."
                    : "No IDSP case records found for this district and disease combination."}
                </p>
              </div>
            )}
          </div>

          <div className="ew-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="ew-eyebrow">Climate Drivers</span>
                  <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--fg)" }}>
                    NASA POWER (SHAP)
                  </h3>
                </div>
                <span className="ew-data-sm" style={{ fontSize: 10 }}>
                  Model Inference
                </span>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                SHAP feature attribution identifies top environmental indicators driving vector and waterborne transmission in {district?.name}.
              </p>

              {shapData && shapData.features.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {shapData.features.slice(0, 4).map((feat, i) => (
                    <div
                      key={feat.feature}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        background: i === 0 ? "rgba(79, 110, 247, 0.04)" : "var(--surface-muted)",
                        boxShadow: "var(--shadow-border)",
                      }}
                    >
                      <span style={{ color: "var(--fg-2)" }}>{feat.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${feat.percentage}%`, background: "var(--brand-start)" }}
                          />
                        </div>
                        <span
                          className="ew-data-sm font-semibold font-mono"
                          style={{ color: getInfluenceColor(feat.percentage) }}
                        >
                          +{feat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[140px] gap-2" style={{ color: "var(--muted)" }}>
                  <span className="text-2xl">🧪</span>
                  <p className="text-sm font-medium">SHAP feature data unavailable</p>
                  <p className="text-xs text-center">Ensure backend API is running to load feature attributions.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 ew-data-sm text-[10px]" style={{ borderTop: "1px solid var(--border)" }}>
              Source: NASA POWER API • Telemetry lag window: 2 weeks
            </div>
          </div>
        </div>

        {/* ML Forecast Chart with visible methodology link (FR-9) */}
        <div className="ew-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="ew-eyebrow">ML Prediction</span>
              <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--fg)" }}>
                Outbreak Forecast (8-Week Bounded Horizon)
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Confidence interval bounded by model variance. Dashed line indicates predicted cases.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/methodology" className="ew-btn-compact text-xs no-underline" style={{ borderRadius: "var(--radius-sm)" }}>
                Methodology (FR-9) →
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="h-[320px] flex items-center justify-center">
              <div className="t-skeleton-reveal w-48 h-4" />
            </div>
          ) : forecast.length > 0 ? (
            <ForecastChart data={forecast} />
          ) : (
            <div className="h-[320px] flex items-center justify-center" style={{ color: "var(--muted)" }}>
              No predictions recorded for these parameters.
            </div>
          )}
        </div>

        {/* Regional News Signals */}
        <NewsSignalPanel districtId={districtId} districtName={district?.name} />

        {/* Precautionary Measures */}
        <PrecautionPanel diseaseId={disease} />

        {/* Govt Benefits & Cost Impact */}
        <GovtBenefitsPanel
          diseaseId={disease}
          projectedCases={forecast.reduce((sum, point) => sum + point.predicted_cases, 0)}
        />
      </main>
    </div>
  );
}
