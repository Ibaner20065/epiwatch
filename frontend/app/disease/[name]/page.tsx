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
    <div className="flex flex-col min-h-screen bg-[#07070b] text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] px-6 py-4 backdrop-blur-md bg-[#09090f]/80">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{meta.icon}</span> {meta.title}
              </h1>
              <p className="text-xs text-slate-400">Targeted Multi-District Outbreak & Environmental Vector Analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {["dengue", "malaria", "add"].map((d) => (
              <Link
                key={d}
                href={`/disease/${d}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  diseaseName === d
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {d}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* Overview Banner */}
        <section className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 mb-3">
            {meta.category}
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            National Surveillance Status: {diseaseName.toUpperCase()}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-sans font-semibold">Primary Environmental Driver</span>
              <span className="text-amber-300">{meta.driver}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-sans font-semibold">Dominant Transmission Pathway</span>
              <span className="text-emerald-300">{meta.pathway}</span>
            </div>
          </div>
        </section>

        {/* Affected District Rankings */}
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
            Districts Ranked by Predicted {diseaseName.toUpperCase()} Peak Burden
          </h3>

          {loading ? (
            <div className="text-xs text-slate-500 font-mono py-8 text-center">Loading disease predictions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3">Risk Tier</th>
                    <th className="py-2.5 px-3">Predicted Peak Cases</th>
                    <th className="py-2.5 px-3">Peak Outbreak Week</th>
                    <th className="py-2.5 px-3">Model Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedPredictions.map((p) => {
                    const dist = districts.find((d) => d.id === p.district_id);
                    return (
                      <tr key={`${p.district_id}_${p.week_start}`} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-3 font-sans font-bold text-slate-200">
                          <Link href={`/district/${p.district_id}`} className="hover:text-indigo-400 underline">
                            {dist?.name || p.district_id}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{dist?.state || "N/A"}</td>
                        <td className="py-3 px-3">
                          <RiskBadge tier={p.risk_tier} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-bold text-rose-400 text-sm">
                          {p.predicted_cases.toLocaleString()} cases
                        </td>
                        <td className="py-3 px-3 text-purple-300">{p.week_start}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">{p.model_version || "v2.0-hgb-xgb"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
