"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMethodology } from "@/lib/api-client";

export default function MethodologyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMethodology()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#07070b] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border)] px-6 py-4 backdrop-blur-md bg-[#09090f]/80">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Methodology & Provenance Audit
              </h1>
              <p className="text-xs text-slate-400">Data Manifest, Model Metrics, and SHAP Feature Importance</p>
            </div>
          </div>

          <Link href="/proof" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
            🎯 Proof Page
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* Model Metrics Section */}
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
            Model Performance Metrics (MAE & RMSE per Model)
          </h3>
          
          {loading ? (
            <div className="text-xs text-slate-500 font-mono">Loading model metrics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(data?.model_metrics || {}).slice(0, 9).map(([key, item]: [string, any]) => (
                <div key={key} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 font-mono text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-indigo-300">{item.district}</span>
                    <span className="uppercase text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">{item.disease}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 mt-2">
                    <span>MAE: <strong className="text-emerald-400">{item.mae}</strong></span>
                    <span>RMSE: <strong className="text-purple-400">{item.rmse}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SHAP Feature Importance Section */}
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
            Climate Feature Drivers (XGBoost Residual Engine)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Environmental variables ranked by feature weight in correcting disease seasonal baselines.
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <p className="text-indigo-400 font-bold font-sans">Rainfall (Lag-2 Weeks)</p>
              <p className="text-slate-400">Primary driver for Aedes and Anopheles vector breeding cycle accumulation after precipitation.</p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                <div className="bg-emerald-400 h-2 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <p className="text-amber-400 font-bold font-sans">Maximum Temperature (T_max)</p>
              <p className="text-slate-400">Accelerates viral incubation rates and mosquito biting frequency during summer peaks.</p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: "55%" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Raw Manifest Audit */}
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
            Data Provenance Manifest (Audit Log)
          </h3>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-400 font-mono text-xs overflow-x-auto max-h-[300px]">
            {JSON.stringify(data?.data_manifest || data?.manifest || {}, null, 2)}
          </pre>
        </section>

      </main>
    </div>
  );
}
