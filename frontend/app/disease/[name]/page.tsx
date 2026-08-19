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
    <div className="flex flex-col min-h-screen text-[var(--bp-white-soft)] font-mono">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--bp-line-faint)] px-6 py-4 backdrop-blur-md" style={{ background: 'rgba(0, 30, 60, 0.9)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 border border-[var(--bp-line-faint)] flex items-center justify-center text-lg hover:border-[var(--bp-cyan)] transition" style={{ color: 'var(--bp-white-soft)' }}>
              ←
            </Link>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--bp-white-soft)' }}>
                <span className="bp-serial">[DIS-01]</span>
                <span>{meta.icon}</span> {meta.title}
              </h1>
              <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>Targeted Multi-District Outbreak &amp; Environmental Vector Analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {["dengue", "malaria", "add"].map((d) => (
              <Link
                key={d}
                href={`/disease/${d}`}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition border font-mono ${
                  diseaseName === d
                    ? "border-[var(--bp-cyan)] text-[var(--bp-cyan)] bg-[rgba(0,255,255,0.08)]"
                    : "border-[var(--bp-line-faint)] text-[var(--bp-white-faint)] hover:text-[var(--bp-white-muted)]"
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
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold border border-[var(--bp-cyan)] border-dashed mb-3" style={{ color: 'var(--bp-cyan)' }}>
            {meta.category}
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--bp-white-soft)' }}>
            National Surveillance Status: {diseaseName.toUpperCase()}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mt-4 text-[10px] font-mono">
            <div className="p-3.5 border border-[var(--bp-line-faint)]">
              <span className="block mb-1 font-bold" style={{ color: 'var(--bp-white-muted)' }}>Primary Environmental Driver</span>
              <span style={{ color: 'var(--bp-cyan)' }}>{meta.driver}</span>
            </div>
            <div className="p-3.5 border border-[var(--bp-line-faint)]">
              <span className="block mb-1 font-bold" style={{ color: 'var(--bp-white-muted)' }}>Dominant Transmission Pathway</span>
              <span style={{ color: 'var(--bp-white-soft)' }}>{meta.pathway}</span>
            </div>
          </div>
          <div className="bp-divider mt-4">
            <span>&lt;── {diseaseName.toUpperCase()} SURVEILLANCE ──&gt;</span>
          </div>
        </section>

        {/* Affected District Rankings */}
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--bp-white-soft)' }}>
            <span className="bp-serial">[TBL-01]</span> Districts Ranked by Predicted {diseaseName.toUpperCase()} Peak Burden
          </h3>

          {loading ? (
            <div className="text-[10px] font-mono py-8 text-center" style={{ color: 'var(--bp-white-faint)' }}>Loading disease predictions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-[var(--bp-line-faint)] text-left" style={{ color: 'var(--bp-white-muted)' }}>
                    <th className="py-2.5 px-3">DISTRICT</th>
                    <th className="py-2.5 px-3">STATE</th>
                    <th className="py-2.5 px-3">RISK TIER</th>
                    <th className="py-2.5 px-3">PREDICTED PEAK CASES</th>
                    <th className="py-2.5 px-3">PEAK OUTBREAK WEEK</th>
                    <th className="py-2.5 px-3">MODEL SOURCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bp-line-faint)]">
                  {sortedPredictions.map((p) => {
                    const dist = districts.find((d) => d.id === p.district_id);
                    return (
                      <tr key={`${p.district_id}_${p.week_start}`} className="hover:bg-[rgba(0,255,255,0.03)] transition">
                        <td className="py-3 px-3 font-bold" style={{ color: 'var(--bp-white-soft)' }}>
                          <Link href={`/district/${p.district_id}`} className="hover:text-[var(--bp-cyan)] border-b border-dashed border-[var(--bp-line-faint)]">
                            {dist?.name || p.district_id}
                          </Link>
                        </td>
                        <td className="py-3 px-3" style={{ color: 'var(--bp-white-faint)' }}>{dist?.state || "N/A"}</td>
                        <td className="py-3 px-3">
                          <RiskBadge tier={p.risk_tier} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-bold text-sm" style={{ color: 'var(--bp-redline)' }}>
                          {p.predicted_cases.toLocaleString()} cases
                        </td>
                        <td className="py-3 px-3" style={{ color: 'var(--bp-white-muted)' }}>{p.week_start}</td>
                        <td className="py-3 px-3 text-[9px]" style={{ color: 'var(--bp-white-faint)' }}>{p.model_version || "v2.0-hgb-xgb"}</td>
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
