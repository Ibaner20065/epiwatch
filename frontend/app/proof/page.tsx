"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchBacktest, fetchDistricts, BacktestEvent, District } from "@/lib/api-client";
import BacktestChart from "@/app/components/BacktestChart";

const DISEASE_LABELS: Record<string, string> = {
  dengue: "Dengue",
  malaria: "Malaria",
  add: "Acute Diarrheal Disease",
};

export default function ProofPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center text-xs font-semibold text-gray-600"
          style={{ background: "var(--surface-muted)" }}
        >
          Loading backtest verification...
        </div>
      }
    >
      <ProofContent />
    </Suspense>
  );
}

function ProofContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramDistrict = searchParams?.get("district_id");
  const paramDisease = searchParams?.get("disease");
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtId, setDistrictId] = useState<string>(paramDistrict?.toUpperCase() || "PUNE");
  const [disease, setDisease] = useState<string>(paramDisease?.toLowerCase() || "dengue");
  const [event, setEvent] = useState<BacktestEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDistricts()
      .then(setDistricts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchBacktest(districtId, disease)
      .then((data) => {
        if (cancelled) return;
        setEvent(data);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setEvent(null);
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [districtId, disease]);

  function changeDistrict(id: string) {
    const d = id.toUpperCase();
    setLoading(true);
    setDistrictId(d);
    router.replace(`/proof?district_id=${d}&disease=${disease}`);
  }

  function changeDisease(dis: string) {
    setLoading(true);
    setDisease(dis);
    router.replace(`/proof?district_id=${districtId}&disease=${dis}`);
  }

  const district = districts.find((d) => d.id.toUpperCase() === districtId);
  const districtName = district?.name || districtId;
  const diseaseLabel = DISEASE_LABELS[disease] || disease;
  const leadTime = event?.metrics_json?.lead_time_weeks ?? event?.predicted_lead_weeks;
  const cutoffDate = event?.metrics_json?.cutoff_date;
  const predictedPeak = event?.metrics_json?.predicted_peak_week;

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
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="ew-btn-secondary text-sm no-underline flex items-center justify-center shrink-0"
              style={{ width: 36, height: 36, padding: 0, borderRadius: "var(--radius-md)" }}
            >
              ←
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-gray-900 truncate">
                <span className="font-mono text-blue-600 mr-1.5">[PRF-01]</span>
                Backtest Proof &amp; Lead Time Verification
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {districtName} · {diseaseLabel} — Live Model Evaluation against Historical Outbreaks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={districtId}
              onChange={(e) => changeDistrict(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded text-gray-900 cursor-pointer focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id.toUpperCase()}>
                  {d.name}
                </option>
              ))}
              {!districts.find((d) => d.id.toUpperCase() === districtId) && (
                <option value={districtId}>{districtName}</option>
              )}
            </select>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded border border-gray-200" style={{ borderRadius: "var(--radius-sm)" }}>
              {["dengue", "malaria", "add"].map((dis) => (
                <button
                  key={dis}
                  onClick={() => changeDisease(dis)}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition ${
                    disease === dis
                      ? "bg-white text-blue-600 shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  {DISEASE_LABELS[dis].split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Callout Header */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded mb-3" style={{ background: "rgba(37, 99, 235, 0.08)", color: "var(--accent)" }}>
            <span>🎯</span> PROOF OF FORECAST ACCURACY
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            {event?.event_name || `${districtName} ${diseaseLabel} Outbreak Backtest`}
          </h2>
          <p className="text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed text-gray-600">
            To prove forecast reliability, the model is trained exclusively on historical data up to the cutoff
            {cutoffDate ? ` (${cutoffDate})` : ""} and its forward projections are then evaluated against actual
            recorded case counts. MAE, RMSE, and outbreak peak timing are computed live from the empirical comparison.
          </p>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="ew-card p-5"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p className="font-mono text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              [MET-01] OUTBREAK LEAD TIME
            </p>
            <p className="text-3xl font-extrabold font-mono text-blue-600">
              {loading ? "..." : leadTime !== undefined ? `${leadTime} Wks` : "N/A"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Model peak vs actual peak lead time</p>
            {predictedPeak && event && (
              <p className="text-xs font-mono font-medium text-gray-600 mt-0.5">
                Predicted peak: {predictedPeak}
              </p>
            )}
          </div>

          <div
            className="ew-card p-5"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p className="font-mono text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              [MET-02] ACTUAL OUTBREAK PEAK
            </p>
            <p className="text-3xl font-extrabold font-mono text-gray-900">
              {loading ? "..." : event?.actual_peak_week || "N/A"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Recorded peak week from IDSP data</p>
          </div>

          <div
            className="ew-card p-5"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p className="font-mono text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              [MET-03] MAE ACCURACY
            </p>
            <p className="text-3xl font-extrabold font-mono text-amber-600">
              {loading ? "..." : event?.metrics_json?.mae !== undefined ? event.metrics_json.mae : "N/A"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Mean Absolute Error (cases)</p>
          </div>

          <div
            className="ew-card p-5"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p className="font-mono text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              [MET-04] RMSE STABILITY
            </p>
            <p className="text-3xl font-extrabold font-mono text-purple-600">
              {loading ? "..." : event?.metrics_json?.rmse !== undefined ? event.metrics_json.rmse : "N/A"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Root Mean Square Error (cases)</p>
          </div>
        </section>

        {/* Chart View */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                <span className="font-mono text-blue-600 mr-1.5">[CHT-01]</span>
                Predicted Outbreak Curve vs Actual Recorded Outcome
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Evaluation of forward projections vs actual recorded surveillance counts
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-gray-700">
                <span className="inline-block w-3 h-0.5 bg-blue-600 border-t-2 border-dashed border-blue-600" />
                Model Forecast (Dashed)
              </span>
              <span className="flex items-center gap-1.5 text-gray-700">
                <span className="inline-block w-3 h-0.5 bg-red-600" />
                Actual Recorded (Solid)
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-[360px] flex items-center justify-center text-xs font-semibold text-gray-500">
              Running live backtest evaluation for {districtName} ({diseaseLabel})...
            </div>
          ) : !event ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
              <span className="text-3xl">⚠️</span>
              <p className="font-bold text-gray-800">No backtest available for this selection</p>
              <p className="text-center max-w-md text-gray-500">
                {error
                  ? `Backend returned an error: ${error}`
                  : "Ensure the backend API is running so the backtest can be computed live from the surveillance data."}
              </p>
            </div>
          ) : (
            <BacktestChart
              weeks={event.metrics_json.weeks}
              actual={event.metrics_json.actual}
              predicted={event.metrics_json.predicted}
            />
          )}

          {event && cutoffDate && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-5 text-xs text-gray-600 font-mono">
              <span>Training Cutoff: <strong className="text-blue-600">{cutoffDate}</strong></span>
              <span>Actual Peak: <strong className="text-gray-900">{event.actual_peak_week}</strong></span>
              {predictedPeak && <span>Predicted Peak: <strong className="text-blue-600">{predictedPeak}</strong></span>}
              <span>Held-out Weeks: <strong className="text-gray-900">{event.metrics_json.weeks.length}</strong></span>
            </div>
          )}
        </section>

        {/* Source Traceability Table */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-900">
            <span className="font-mono text-blue-600 mr-1.5">[TBL-01]</span>
            Pitch Claim Traceability
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 font-semibold">
                  <th className="py-2.5 px-3">CLAIM</th>
                  <th className="py-2.5 px-3">PROVEN VALUE</th>
                  <th className="py-2.5 px-3">SOURCE ARTIFACT POINTER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition">
                  <td className="py-3 px-3 font-medium text-gray-800">&quot;Backtested forecast accuracy&quot;</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">
                    {event ? `MAE ${event.metrics_json.mae} • RMSE ${event.metrics_json.rmse}` : "N/A"}
                  </td>
                  <td className="py-3 px-3 text-gray-500 font-mono">Supabase `backtest_runs` (live HGB+XGBoost backtest)</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="py-3 px-3 font-medium text-gray-800">&quot;Model pins outbreak peak timing&quot;</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">
                    {event ? `Predicted peak within ${leadTime} wks of actual (${event.actual_peak_week})` : "N/A"}
                  </td>
                  <td className="py-3 px-3 text-gray-500 font-mono">Computed from `case_data` vs model forward projection</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="py-3 px-3 font-medium text-gray-800">&quot;Climate-aware residual predictions&quot;</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">Rainfall &amp; Temp Lags</td>
                  <td className="py-3 px-3 text-gray-500 font-mono">ml/results/shap_importance.json</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="py-3 px-3 font-medium text-gray-800">&quot;Verified IDSP surveillance data&quot;</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">IDSP Baseline Surveillance DB</td>
                  <td className="py-3 px-3 text-gray-500 font-mono">data/data_manifest.json</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-6 border-t border-gray-200 mt-8"
        style={{ background: "var(--surface)" }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p className="font-semibold text-gray-900">
            EpiWatch Live Model Evaluation Engine
          </p>
          <p className="font-mono text-gray-500">
            BACKTEST PROTOCOL • EMPIRICAL RESIDUAL TESTING • SIH26004
          </p>
        </div>
      </footer>
    </div>
  );
}
