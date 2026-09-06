"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchDistricts, fetchForecast, District, ForecastPoint } from "@/lib/api-client";
import RiskBadge from "@/app/components/RiskBadge";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default function DiseasePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const diseaseName = resolvedParams.name.toLowerCase();
  
  const [districts, setDistricts] = useState<District[]>([]);
  const [predictions, setPredictions] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDistricts()
      .then(async (dList) => {
        setDistricts(dList);
        const predPromises = dList.map((d) => fetchForecast(d.id, diseaseName));
        const results = await Promise.all(predPromises);
        setPredictions(results.flat());
      })
      .finally(() => setLoading(false));
  }, [diseaseName]);

  const diseaseMeta: Record<string, { title: string; category: string; driver: string; pathway: string; icon: string }> = {
    dengue: {
      title: "Dengue Fever Vector Surveillance",
      category: "Arboviral Vector-Borne",
      driver: "Accumulated 2-week precipitation lag + mean temperature 28–32°C",
      pathway: "Aedes aegypti / Aedes albopictus container breeding in stagnant urban water",
      icon: "🦟",
    },
    malaria: {
      title: "Malaria Epidemiological Intelligence",
      category: "Protozoan Vector-Borne",
      driver: "Monsoon humidity > 70% + vegetative canopy moisture",
      pathway: "Anopheles stephensi / Anopheles culicifacies vector propagation",
      icon: "🦟",
    },
    add: {
      title: "Acute Diarrheal Disease (ADD) Surveillance",
      category: "Waterborne Enteric Disease",
      driver: "Post-monsoon flood run-off + drinking water infrastructure contamination",
      pathway: "Fecal-oral route via contaminated water supplies & peri-urban drainage",
      icon: "💧",
    },
  };

  const meta = diseaseMeta[diseaseName] || {
    title: `${diseaseName.toUpperCase()} Outbreak Intelligence`,
    category: "Infectious Disease Surveillance",
    driver: "Climate telemetry & IDSP surveillance baseline",
    pathway: "Environmental & demographic transmission vectors",
    icon: "🦠",
  };

  const sortedPredictions = [...predictions].sort((a, b) => b.predicted_cases - a.predicted_cases);

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "var(--font-sans)", background: "var(--surface-muted)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px var(--border)",
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="ew-btn-secondary text-sm no-underline flex items-center justify-center shrink-0"
              style={{ width: 36, height: 36, padding: 0, borderRadius: "var(--radius-md)" }}
            >
              ←
            </Link>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <span className="font-mono text-blue-600 mr-1">[DIS-01]</span>
                <span>{meta.icon}</span> {meta.title}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Targeted Multi-District Outbreak &amp; Environmental Vector Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded border border-gray-200" style={{ borderRadius: "var(--radius-sm)" }}>
            {["dengue", "malaria", "add"].map((d) => (
              <Link
                key={d}
                href={`/disease/${d}`}
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition no-underline ${
                  diseaseName === d
                    ? "bg-white text-blue-600 shadow-sm font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                {d}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* Overview Banner */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded mb-3"
            style={{ background: "rgba(37, 99, 235, 0.08)", color: "var(--accent)" }}
          >
            {meta.category}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            National Surveillance Status: {diseaseName.toUpperCase()}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-5 text-xs">
            <div
              className="p-4 bg-gray-50 border border-gray-200 rounded"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <span className="block mb-1 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                Primary Environmental Driver
              </span>
              <span className="font-bold text-gray-900 text-sm">{meta.driver}</span>
            </div>
            <div
              className="p-4 bg-gray-50 border border-gray-200 rounded"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <span className="block mb-1 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                Dominant Transmission Pathway
              </span>
              <span className="font-bold text-gray-900 text-sm">{meta.pathway}</span>
            </div>
          </div>
        </section>

        {/* Affected District Rankings */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-900">
            <span className="font-mono text-blue-600 mr-1.5">[TBL-01]</span>
            Districts Ranked by Predicted {diseaseName.toUpperCase()} Peak Burden
          </h3>

          {loading ? (
            <div className="text-xs font-mono py-8 text-center text-gray-500">
              Loading disease predictions across monitored districts...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 font-semibold">
                    <th className="py-2.5 px-3">DISTRICT</th>
                    <th className="py-2.5 px-3">STATE</th>
                    <th className="py-2.5 px-3">RISK TIER</th>
                    <th className="py-2.5 px-3">PREDICTED PEAK CASES</th>
                    <th className="py-2.5 px-3">PEAK OUTBREAK WEEK</th>
                    <th className="py-2.5 px-3">MODEL SOURCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedPredictions.map((p) => {
                    const dist = districts.find((d) => d.id === p.district_id);
                    return (
                      <tr key={`${p.district_id}_${p.week_start}`} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-3 font-bold text-gray-900">
                          <Link href={`/district/${p.district_id}`} className="hover:text-blue-600 no-underline">
                            {dist?.name || p.district_id}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{dist?.state || "N/A"}</td>
                        <td className="py-3 px-3">
                          <RiskBadge tier={p.risk_tier} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-bold font-mono text-red-600">
                          {p.predicted_cases.toLocaleString()} cases
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-700">{p.week_start}</td>
                        <td className="py-3 px-3 font-mono text-gray-500 text-[11px]">{p.model_version || "v2.0-hgb-xgb"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-6 border-t border-gray-200 mt-8"
        style={{ background: "var(--surface)" }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p className="font-semibold text-gray-900">
            EpiWatch Targeted Outbreak Surveillance Engine
          </p>
          <p className="font-mono text-gray-500">
            IDSP SURVEILLANCE • MULTI-DISTRICT SENSOR • SIH26004
          </p>
        </div>
      </footer>
    </div>
  );
}
