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
    <Suspense fallback={<div className="min-h-screen bg-[#07070b] text-slate-100 flex items-center justify-center">Loading backtest...</div>}>
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
    <div className="flex flex-col min-h-screen bg-[#07070b] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border)] px-6 py-4 backdrop-blur-md bg-[#09090f]/80">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition shrink-0">
              ←
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-white truncate">
                Backtest Proof & Lead Time Verification
              </h1>
              <p className="text-xs text-slate-400">
                {districtName} {diseaseLabel} — Live Model Evaluation against Historical Outbreaks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={districtId}
              onChange={(e) => changeDistrict(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800 transition cursor-pointer"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id.toUpperCase()} className="bg-slate-900">
                  {d.name}
                </option>
              ))}
              {!districts.find((d) => d.id.toUpperCase() === districtId) && (
                <option value={districtId} className="bg-slate-900">{districtName}</option>
              )}
            </select>
            {["dengue", "malaria", "add"].map((dis) => (
              <button
                key={dis}
                onClick={() => changeDisease(dis)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition border ${
                  disease === dis
                    ? "bg-indigo-600 text-white border-indigo-400"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                {DISEASE_LABELS[dis].split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

        {/* Callout Header */}
        <section className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-3">
            🎯 Proof of Forecast Accuracy
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {event?.event_name || `${districtName} ${diseaseLabel} Outbreak Backtest`}
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            To prove forecast reliability, the model is trained exclusively on historical data up to the cutoff
            {cutoffDate ? ` (${cutoffDate})` : ""} and its forward projections are then evaluated against actual
            recorded case counts. MAE, RMSE and peak timing are computed live from the comparison — nothing is pre-baked.
          </p>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Outbreak Lead Time</p>
            <p className="text-3xl font-extrabold font-mono text-emerald-400">
              {loading ? "Loading..." : leadTime !== undefined ? `${leadTime} Wks` : "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Model peak vs actual peak gap</p>
            {predictedPeak && event && (
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                Predicted peak {predictedPeak}
              </p>
            )}
          </div>

          <div className="stat-card">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Actual Outbreak Peak</p>
            <p className="text-2xl font-extrabold font-mono text-indigo-400">
              {loading ? "Loading..." : event?.actual_peak_week || "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Recorded peak week</p>
          </div>

          <div className="stat-card">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Mean Absolute Error (MAE)</p>
            <p className="text-3xl font-extrabold font-mono text-purple-400">
              {loading ? "Loading..." : event?.metrics_json?.mae !== undefined ? event.metrics_json.mae : "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Average case deviation (cases)</p>
          </div>

          <div className="stat-card">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">RMSE (Root Mean Square Error Cases)</p>
            <p className="text-3xl font-extrabold font-mono text-amber-400">
              {loading ? "Loading..." : event?.metrics_json?.rmse !== undefined ? event.metrics_json.rmse : "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Root Mean Square Error (cases)</p>
          </div>
        </section>

        {/* Chart View */}
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Predicted Outbreak Curve vs Actual Recorded Outcome
            </h3>
            <span className="text-xs text-slate-500">Green = Model Forecast • Red = Actual Recorded</span>
          </div>

          {loading ? (
            <div className="h-[360px] flex items-center justify-center text-slate-500">Running live backtest for {districtName} ({diseaseLabel})...</div>
          ) : !event ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="font-semibold">No backtest available for this selection</p>
              <p className="text-slate-600 text-center max-w-md">
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
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-4 text-[10px] font-mono text-slate-500">
              <span>Training cutoff: <span className="text-emerald-400">{cutoffDate}</span></span>
              <span>Actual peak: <span className="text-indigo-400">{event.actual_peak_week}</span></span>
              {predictedPeak && <span>Predicted peak: <span className="text-emerald-400">{predictedPeak}</span></span>}
              <span>Held-out weeks: <span className="text-slate-300">{event.metrics_json.weeks.length}</span></span>
            </div>
          )}
        </section>

        {/* Source Traceability Table */}
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
            Pitch Claim Traceability
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-500">
                  <th className="py-2">Claim</th>
                  <th className="py-2">Proven Value</th>
                  <th className="py-2">Source Artifact Pointer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2.5 text-slate-300 font-sans">&quot;Backtested forecast accuracy&quot;</td>
                  <td className="py-2.5 text-emerald-400">
                    {event ? `MAE ${event.metrics_json.mae} • RMSE ${event.metrics_json.rmse}` : "N/A"}
                  </td>
                  <td className="py-2.5 text-indigo-400">Supabase `backtest_runs` (live HGB+XGBoost backtest)</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-300 font-sans">&quot;Model pins outbreak peak timing&quot;</td>
                  <td className="py-2.5 text-emerald-400">
                    {event ? `Predicted peak within ${leadTime} wks of actual (${event.actual_peak_week})` : "N/A"}
                  </td>
                  <td className="py-2.5 text-indigo-400">Computed from `case_data` vs model forward projection</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-300 font-sans">&quot;Climate-aware residual predictions&quot;</td>
                  <td className="py-2.5 text-emerald-400">Rainfall & Temp Lags</td>
                  <td className="py-2.5 text-indigo-400">ml/results/shap_importance.json</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-300 font-sans">&quot;Verified IDSP surveillance data&quot;</td>
                  <td className="py-2.5 text-emerald-400">IDSP Baseline Surveillance DB</td>
                  <td className="py-2.5 text-indigo-400">data/data_manifest.json</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
