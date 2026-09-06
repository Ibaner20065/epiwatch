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
  const [, setError] = useState<string | null>(null);

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
    <div className="flex flex-col min-h-dvh relative" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Predictor Simulation Overlay */}
      {showSimulation && (
        <PredictorSimulation
          selectedDistrictId={selectedDistrictId}
          selectedDisease={selectedDisease}
          onClose={() => setShowSimulation(false)}
        />
      )}

      {/* AI Assistant Drawer */}
      {showAssistant && <AssistantChat onClose={() => setShowAssistant(false)} />}

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 px-6 py-3"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px var(--border)",
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="ew-icon-circle"
              style={{
                background: "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
                borderRadius: "var(--radius-md)",
              }}
            >
              <span className="text-white text-lg">🌾</span>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
                EpiWatch GramRaksha
              </h1>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                Rural One-Health &amp; Outbreak Prediction Engine
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 flex-wrap">
            {/* Human ↔ PashuRaksha Segmented Control (t-tabs-sliding) */}
            <div className="t-tabs-sliding mr-2">
              <Link
                href="/"
                className="relative z-10 px-3 py-1.5 text-xs font-semibold rounded-full no-underline transition-colors"
                style={{
                  color: "var(--accent)",
                  background: "var(--surface)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                🇮🇳 Rural Health
              </Link>
              <Link
                href="/livestock"
                className="relative z-10 px-3 py-1.5 text-xs font-medium rounded-full no-underline transition-colors"
                style={{ color: "var(--muted)" }}
              >
                🐄 PashuRaksha
              </Link>
            </div>

            <button
              onClick={() => setShowAssistant(true)}
              className="ew-btn-primary text-xs"
              style={{ height: 36, padding: "0 14px", borderRadius: "var(--radius-md)" }}
            >
              💬 Ask Assistant
            </button>
            <Link
              href="/livestock/report"
              className="ew-btn-secondary text-xs no-underline"
              style={{ height: 36, padding: "0 12px", borderRadius: "var(--radius-md)" }}
            >
              📝 Field Report
            </Link>
            <Link
              href="/livestock/lab"
              className="ew-btn-secondary text-xs no-underline"
              style={{ height: 36, padding: "0 12px", borderRadius: "var(--radius-md)" }}
            >
              🔬 Lab Referrals
            </Link>
            <Link
              href="/oa"
              className="ew-btn-ghost text-xs no-underline"
              style={{ height: 36, padding: "0 10px", borderRadius: "var(--radius-md)" }}
            >
              🦵 OA Screening
            </Link>
            {/* FR-9 Visible links to Methodology & Proof */}
            <Link
              href={`/proof?district_id=${selectedDistrictId || "PUNE"}&disease=${selectedDisease}`}
              className="ew-btn-ghost text-xs no-underline"
              style={{ height: 36, padding: "0 10px", borderRadius: "var(--radius-md)" }}
            >
              🎯 Proof (FR-9)
            </Link>
            <Link
              href="/methodology"
              className="ew-btn-ghost text-xs no-underline"
              style={{ height: 36, padding: "0 10px", borderRadius: "var(--radius-md)" }}
            >
              📊 Methodology (FR-9)
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* ── Hero / Overview ── */}
        <section className="ew-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: "rgba(79, 110, 247, 0.08)", color: "var(--accent)" }}
                >
                  <span className="ew-live-dot" style={{ width: 6, height: 6 }} />
                  Rural One-Health Defense Shield v2.0
                </span>
                <span className="ew-badge ew-badge--moderate text-[10px]">
                  356 Maharashtra Tehsils Tracked
                </span>
              </div>

              {/* Part 1.3 Display Title with Negative Tracking */}
              <h2
                className="text-2xl sm:text-4xl font-bold tracking-display"
                style={{ color: "var(--fg)", letterSpacing: "var(--tracking-display)" }}
              >
                Rural Epidemic Early Warning &amp; Livestock Livelihood Shield
              </h2>
              <p
                className="text-sm mt-2 leading-relaxed max-w-4xl"
                style={{ color: "var(--fg-2)" }}
              >
                Empowering Gram Panchayats, Primary Health Centres (PHCs), and smallholder farmers by
                fusing IDSP epidemiological data, 19th Livestock Census block figures, and NASA POWER
                climate satellite telemetry to forecast waterborne surges and animal epidemics 6–8
                weeks in advance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Rectangular Primary Button (8px radius) */}
              <button
                onClick={() => setShowSimulation(true)}
                className="ew-btn-primary flex items-center justify-center gap-2"
                style={{ height: 44, padding: "0 20px", borderRadius: "var(--radius-md)" }}
              >
                <span>⚡</span>
                <span>Run Predictor</span>
              </button>

              {/* Disease Filter Segmented Control (t-tabs-sliding) */}
              <div
                className="t-tabs-sliding p-1"
                style={{ background: "var(--surface-muted)" }}
              >
                {[
                  { id: "dengue", label: "🦟 Dengue" },
                  { id: "malaria", label: "🦟 Malaria" },
                  { id: "add", label: "💧 ADD" },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDisease(d.id)}
                    className="relative z-10 px-3 py-1.5 text-xs font-semibold rounded-full transition-all border-none cursor-pointer"
                    style={{
                      background: selectedDisease === d.id ? "var(--surface)" : "transparent",
                      color: selectedDisease === d.id ? "var(--accent)" : "var(--muted)",
                      boxShadow:
                        selectedDisease === d.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick-Action Cards — Icon-in-circle pattern */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <Link
              href="/livestock"
              className="p-4 rounded-lg transition-all no-underline group hover:shadow-sm"
              style={{
                background: "var(--surface-muted)",
                boxShadow: "var(--shadow-border)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="ew-icon-circle"
                  style={{ background: "rgba(79, 110, 247, 0.08)", borderRadius: "var(--radius-md)" }}
                >
                  🐄
                </div>
                <span
                  className="text-sm font-semibold group-hover:text-[var(--brand-start)] transition-colors"
                  style={{ color: "var(--fg)" }}
                >
                  PashuRaksha
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                National MOSPI ML forecasts &amp; 34 Maharashtra district cattle/poultry trends.
              </p>
            </Link>

            <Link
              href="/livestock/report"
              className="p-4 rounded-lg transition-all no-underline group hover:shadow-sm"
              style={{
                background: "var(--surface-muted)",
                boxShadow: "var(--shadow-border)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="ew-icon-circle"
                  style={{ background: "rgba(79, 110, 247, 0.08)", borderRadius: "var(--radius-md)" }}
                >
                  📍
                </div>
                <span
                  className="text-sm font-semibold group-hover:text-[var(--brand-start)] transition-colors"
                  style={{ color: "var(--fg)" }}
                >
                  Pashu Sakhi Intake
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Village symptom reporting with NLP triage &amp; Marathi/Hindi voice intake.
              </p>
            </Link>

            <Link
              href="/livestock/lab"
              className="p-4 rounded-lg transition-all no-underline group hover:shadow-sm"
              style={{
                background: "var(--surface-muted)",
                boxShadow: "var(--shadow-border)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="ew-icon-circle"
                  style={{ background: "rgba(79, 110, 247, 0.08)", borderRadius: "var(--radius-md)" }}
                >
                  🔬
                </div>
                <span
                  className="text-sm font-semibold group-hover:text-[var(--brand-start)] transition-colors"
                  style={{ color: "var(--fg)" }}
                >
                  Lab Pipeline
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Sample transport, cold-chain monitoring &amp; automated outbreak alerts.
              </p>
            </Link>

            <Link
              href="/oa"
              className="p-4 rounded-lg transition-all no-underline group hover:shadow-sm"
              style={{
                background: "var(--surface-muted)",
                boxShadow: "var(--shadow-border)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="ew-icon-circle"
                  style={{ background: "rgba(79, 110, 247, 0.08)", borderRadius: "var(--radius-md)" }}
                >
                  🦵
                </div>
                <span
                  className="text-sm font-semibold group-hover:text-[var(--brand-start)] transition-colors"
                  style={{ color: "var(--fg)" }}
                >
                  OA Screening
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                WOMAC joint disability screening for rural agricultural workers.
              </p>
            </Link>
          </div>
        </section>

        {/* ── KPI Stat Cards with t-number-pop-in and Negative Tracking ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ew-stat-card">
            <p className="ew-eyebrow mb-1">Monitored Districts</p>
            {loading ? (
              <div className="t-skeleton-reveal h-8 w-20 mb-1" />
            ) : (
              <p className="ew-data-lg tracking-kpi t-number-pop-in">{districts.length || 9}</p>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Across 3 States (MH, WB, KA)
            </p>
            <p className="ew-data-sm mt-3 pt-2 text-[10px]" style={{ borderTop: "1px solid var(--border)" }}>
              Source: Supabase DB
            </p>
          </div>

          <div className="ew-stat-card">
            <p className="ew-eyebrow mb-1">Outbreak Early Warning</p>
            <p className="ew-data-lg tracking-kpi t-number-pop-in">6.5 Wks</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Mean Backtest Peak Lead Time
            </p>
            <p className="ew-data-sm mt-3 pt-2 text-[10px]" style={{ borderTop: "1px solid var(--border)" }}>
              Method: Peak Shift Evaluation
            </p>
          </div>

          <div className="ew-stat-card">
            <p className="ew-eyebrow mb-1">Forecast Horizon</p>
            <p className="ew-data-lg tracking-kpi t-number-pop-in">8 Weeks</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Weekly-grain confidence bounded
            </p>
            <p className="ew-data-sm mt-3 pt-2 text-[10px]" style={{ borderTop: "1px solid var(--border)" }}>
              Model: v2.0-hgb-xgb Ensemble
            </p>
          </div>

          <div className="ew-stat-card">
            <p className="ew-eyebrow mb-1">Elevated Risk Warnings</p>
            {loading ? (
              <div className="t-skeleton-reveal h-8 w-16 mb-1" />
            ) : (
              <p
                className="ew-data-lg tracking-kpi t-number-pop-in"
                style={{ color: "var(--danger)" }}
              >
                {atRiskCount}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              High &amp; Critical Tier Districts
            </p>
            <p className="ew-data-sm mt-3 pt-2 text-[10px]" style={{ borderTop: "1px solid var(--border)" }}>
              Source: Predictions table
            </p>
          </div>
        </section>

        {/* ── Map + District Overview ── */}
        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="ew-eyebrow">Risk Surface</span>
                <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--fg)" }}>
                  National District Risk Map ({selectedDisease.charAt(0).toUpperCase() + selectedDisease.slice(1)})
                </h3>
              </div>
              <span className="ew-data-sm">Weekly Surveillance</span>
            </div>
            <IndiaMap
              districts={districts}
              predictions={predictions}
              selectedDisease={selectedDisease}
            />
          </div>

          <div className="lg:col-span-2 ew-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="ew-eyebrow">Target Districts</span>
                  <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--fg)" }}>
                    {districts.length} Districts
                  </h3>
                </div>
                <span className="ew-data-sm">Sorted by Risk</span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
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
                      className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-sm"
                      style={{
                        background: "var(--surface-muted)",
                        boxShadow: "var(--shadow-border)",
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                          {d.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {d.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <RiskBadge tier={tier} size="sm" />
                        <p className="ew-data-sm mt-1">{cases.toLocaleString()} est. cases</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="mt-4 pt-4 flex items-center justify-between text-xs"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span className="ew-data-sm">Data: IDSP + NASA + Census</span>
              <button
                onClick={() => setShowAssistant(true)}
                className="ew-btn-ghost text-xs"
                style={{ height: 32, borderRadius: "var(--radius-sm)" }}
              >
                💬 Ask Assistant →
              </button>
            </div>
          </div>
        </section>

        {/* ── Alert Feed (FR-4) ── */}
        <AlertFeed />

        {/* ── District Threat Table ── */}
        <section className="ew-card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
            <div>
              <span className="ew-eyebrow">Ranked Threat Matrix</span>
              <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--fg)" }}>
                District Outbreak Risk ({selectedDisease.charAt(0).toUpperCase() + selectedDisease.slice(1)})
              </h3>
            </div>
            <span
              className="ew-data-sm px-3 py-1 rounded-md"
              style={{ background: "var(--surface-muted)", boxShadow: "var(--shadow-border)" }}
            >
              Model v2.0-hgb-xgb
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>State</th>
                  <th>Risk Tier</th>
                  <th>Est. Peak Cases</th>
                  <th>Lead Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
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
                  .map(({ district: d, cases, tier }) => (
                    <tr key={d.id}>
                      <td className="font-medium">
                        <Link
                          href={`/district/${d.id}`}
                          className="hover:text-[var(--brand-start)] transition-colors no-underline font-semibold"
                          style={{ color: "var(--fg)" }}
                        >
                          {d.name}
                        </Link>
                      </td>
                      <td style={{ color: "var(--fg-2)" }}>{d.state}</td>
                      <td>
                        <RiskBadge tier={tier} size="sm" />
                      </td>
                      <td>
                        <span className="ew-data-sm font-semibold">
                          {cases ? cases.toLocaleString() : "N/A"}
                        </span>
                      </td>
                      <td className="ew-data-sm">6.5 Wks</td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedDistrictId(d.id);
                            setShowSimulation(true);
                          }}
                          className="ew-btn-compact"
                          style={{
                            height: 32,
                            padding: "0 10px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          ⚡ Intel
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Floating Assistant Button (8px radius, explicitly NOT pill-shaped) */}
      {!showAssistant && (
        <button
          onClick={() => setShowAssistant(true)}
          className="fixed bottom-6 right-6 z-40 ew-btn-primary shadow-lg"
          style={{
            height: 48,
            padding: "0 20px",
            borderRadius: "var(--radius-md)",
          }}
        >
          <span className="text-base">💬</span>
          Ask EpiWatch AI
        </button>
      )}

      {/* Footer with PRD §2 disclaimer */}
      <footer
        className="px-6 py-6 mt-12"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p style={{ color: "var(--fg)" }}>
            <strong style={{ color: "var(--brand-start)" }}>EpiWatch India</strong> — Multi-Disease
            Outbreak Prediction Platform
          </p>
          <div className="flex items-center gap-4">
            <Link href="/methodology" className="ew-data-sm hover:underline">
              Model Methodology (FR-9)
            </Link>
            <span style={{ color: "var(--border)" }}>•</span>
            <Link href="/proof" className="ew-data-sm hover:underline">
              Backtest Proof
            </Link>
          </div>
        </div>
        <div
          className="max-w-[1400px] mx-auto mt-3 pt-3 text-center"
          style={{ borderTop: "1px solid var(--border-soft)" }}
        >
          <p className="ew-eyebrow" style={{ fontSize: 10, color: "var(--muted)" }}>
            ⚠️ Public-health operational forecasting system — Not an individual clinical diagnostic tool.
          </p>
        </div>
      </footer>
    </div>
  );
}
