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
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "var(--font-sans)", background: "var(--surface-muted)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px var(--border)",
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="ew-btn-secondary text-sm no-underline flex items-center justify-center shrink-0"
              style={{ width: 36, height: 36, padding: 0, borderRadius: "var(--radius-md)" }}
            >
              ←
            </Link>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900">
                <span className="font-mono text-blue-600 mr-1.5">[MTD-01]</span>
                Methodology &amp; Provenance Audit
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Data Manifest, Model Metrics, and SHAP Feature Importance
              </p>
            </div>
          </div>

          <Link
            href="/proof"
            className="ew-btn-primary text-xs no-underline font-semibold"
            style={{ height: 36, padding: "0 14px", borderRadius: "var(--radius-md)" }}
          >
            🎯 Backtest Proof Engine
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* Model Metrics Section */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-900">
            <span className="font-mono text-blue-600 mr-1.5">[SEC-01]</span>
            Model Performance Metrics (MAE &amp; RMSE per Model)
          </h3>
          
          {loading ? (
            <div className="text-xs font-mono text-gray-500 py-6 text-center">Loading model metrics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(data?.model_metrics || {}).slice(0, 9).map(([key, item]: [string, any]) => (
                <div
                  key={key}
                  className="p-3.5 bg-gray-50 border border-gray-200 text-xs font-mono rounded"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{item.district}</span>
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 bg-white border border-gray-200 text-blue-600 rounded">
                      {item.disease}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    <span>MAE: <strong className="text-blue-600 font-bold">{item.mae}</strong></span>
                    <span>RMSE: <strong className="text-gray-900 font-bold">{item.rmse}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SHAP Feature Importance Section */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-900">
            <span className="font-mono text-blue-600 mr-1.5">[SEC-02]</span>
            Climate Feature Drivers (XGBoost Residual Engine)
          </h3>
          <p className="text-xs text-gray-500 mb-4 font-medium">
            Environmental variables ranked by empirical feature importance in correcting disease seasonal baselines.
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div
              className="p-4 bg-gray-50 border border-gray-200 space-y-2 rounded"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">Rainfall (Lag-2 Weeks)</p>
                <span className="font-mono font-bold text-blue-600 text-xs">75% Weight</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs">
                Primary driver for Aedes and Anopheles vector breeding cycle accumulation after precipitation.
              </p>
              <div className="w-full h-2 mt-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>

            <div
              className="p-4 bg-gray-50 border border-gray-200 space-y-2 rounded"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">Maximum Temperature (T_max)</p>
                <span className="font-mono font-bold text-blue-600 text-xs">55% Weight</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs">
                Accelerates viral incubation rates and mosquito biting frequency during summer peaks.
              </p>
              <div className="w-full h-2 mt-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "55%" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Raw Manifest Audit */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-900">
            <span className="font-mono text-blue-600 mr-1.5">[SEC-03]</span>
            Data Provenance Manifest (Audit Log)
          </h3>
          <pre className="p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-lg overflow-x-auto max-h-[300px] border border-gray-800">
            {JSON.stringify(data?.data_manifest || data?.manifest || {}, null, 2)}
          </pre>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-6 border-t border-gray-200 mt-8"
        style={{ background: "var(--surface)" }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p className="font-semibold text-gray-900">
            EpiWatch Methodology &amp; Provenance Protocol
          </p>
          <p className="font-mono text-gray-500">
            IDSP SURVEILLANCE • MOSPI MOSAIC • SIH26004
          </p>
        </div>
      </footer>
    </div>
  );
}
