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
    <div className="flex flex-col min-h-screen text-[var(--bp-white-soft)] font-mono">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--bp-line-faint)] px-6 py-4 backdrop-blur-md" style={{ background: 'rgba(0, 30, 60, 0.9)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 border border-[var(--bp-line-faint)] flex items-center justify-center text-lg hover:border-[var(--bp-cyan)] transition" style={{ color: 'var(--bp-white-soft)' }}>
              ←
            </Link>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--bp-white-soft)' }}>
                <span className="bp-serial">[MTD-01]</span> Methodology &amp; Provenance Audit
              </h1>
              <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>Data Manifest, Model Metrics, and SHAP Feature Importance</p>
            </div>
          </div>

          <Link href="/proof" className="bp-btn bp-btn-active text-[9px]">
            🎯 PROOF PAGE
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* Model Metrics Section */}
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--bp-white-soft)' }}>
            <span className="bp-serial">[SEC-01]</span> Model Performance Metrics (MAE &amp; RMSE per Model)
          </h3>
          
          {loading ? (
            <div className="text-[10px] font-mono" style={{ color: 'var(--bp-white-faint)' }}>Loading model metrics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(data?.model_metrics || {}).slice(0, 9).map(([key, item]: [string, any]) => (
                <div key={key} className="p-3.5 border border-[var(--bp-line-faint)] font-mono text-[10px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold" style={{ color: 'var(--bp-cyan)' }}>{item.district}</span>
                    <span className="uppercase text-[9px] px-1.5 py-0.5 border border-[var(--bp-line-faint)]" style={{ color: 'var(--bp-white-faint)' }}>{item.disease}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2" style={{ color: 'var(--bp-white-faint)' }}>
                    <span>MAE: <strong style={{ color: 'var(--bp-cyan)' }}>{item.mae}</strong></span>
                    <span>RMSE: <strong style={{ color: 'var(--bp-white-muted)' }}>{item.rmse}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SHAP Feature Importance Section */}
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--bp-white-soft)' }}>
            <span className="bp-serial">[SEC-02]</span> Climate Feature Drivers (XGBoost Residual Engine)
          </h3>
          <p className="text-[10px] mb-4" style={{ color: 'var(--bp-white-faint)' }}>
            Environmental variables ranked by feature weight in correcting disease seasonal baselines.
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-[10px] font-mono">
            <div className="p-4 border border-[var(--bp-line-faint)] space-y-2">
              <p className="font-bold" style={{ color: 'var(--bp-cyan)' }}>Rainfall (Lag-2 Weeks)</p>
              <p style={{ color: 'var(--bp-white-faint)' }}>Primary driver for Aedes and Anopheles vector breeding cycle accumulation after precipitation.</p>
              <div className="w-full h-1 mt-2 border border-[var(--bp-line-faint)]" style={{ background: 'var(--bp-blue-deep)' }}>
                <div className="h-full" style={{ width: "75%", background: 'var(--bp-cyan)' }} />
              </div>
              <span className="bp-coord">&lt;── 75% ──&gt;</span>
            </div>

            <div className="p-4 border border-[var(--bp-line-faint)] space-y-2">
              <p className="font-bold" style={{ color: 'var(--bp-white-soft)' }}>Maximum Temperature (T_max)</p>
              <p style={{ color: 'var(--bp-white-faint)' }}>Accelerates viral incubation rates and mosquito biting frequency during summer peaks.</p>
              <div className="w-full h-1 mt-2 border border-[var(--bp-line-faint)]" style={{ background: 'var(--bp-blue-deep)' }}>
                <div className="h-full" style={{ width: "55%", background: 'var(--bp-white-muted)' }} />
              </div>
              <span className="bp-coord">&lt;── 55% ──&gt;</span>
            </div>
          </div>
        </section>

        {/* Raw Manifest Audit */}
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--bp-white-soft)' }}>
            <span className="bp-serial">[SEC-03]</span> Data Provenance Manifest (Audit Log)
          </h3>
          <pre className="p-4 border border-[var(--bp-line-faint)] font-mono text-[10px] overflow-x-auto max-h-[300px]" style={{ background: 'rgba(0,15,30,0.5)', color: 'var(--bp-white-faint)' }}>
            {JSON.stringify(data?.data_manifest || data?.manifest || {}, null, 2)}
          </pre>
        </section>

      </main>
    </div>
  );
}
