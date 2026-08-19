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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-[10px]" style={{ background: 'var(--bp-blue)', color: 'var(--bp-white-faint)' }}>Loading backtest...</div>}>
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
    <div className="flex flex-col min-h-screen text-[var(--bp-white-soft)] font-mono">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--bp-line-faint)] px-6 py-4 backdrop-blur-md" style={{ background: 'rgba(0, 30, 60, 0.9)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="w-10 h-10 border border-[var(--bp-line-faint)] flex items-center justify-center text-lg hover:border-[var(--bp-cyan)] transition shrink-0" style={{ color: 'var(--bp-white-soft)' }}>
              ←
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-widest uppercase truncate" style={{ color: 'var(--bp-white-soft)' }}>
                <span className="bp-serial">[PRF-01]</span> Backtest Proof &amp; Lead Time Verification
              </h1>
              <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>
                {districtName} {diseaseLabel} — Live Model Evaluation against Historical Outbreaks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={districtId}
              onChange={(e) => changeDistrict(e.target.value)}
              className="px-3 py-1.5 text-[10px] font-bold border border-[var(--bp-line-faint)] font-mono cursor-pointer focus:outline-none focus:border-[var(--bp-cyan)]"
              style={{ background: 'rgba(0,20,40,0.8)', color: 'var(--bp-white-soft)' }}
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id.toUpperCase()} style={{ background: '#002244' }}>
                  {d.name}
                </option>
              ))}
              {!districts.find((d) => d.id.toUpperCase() === districtId) && (
                <option value={districtId} style={{ background: '#002244' }}>{districtName}</option>
              )}
            </select>
            {["dengue", "malaria", "add"].map((dis) => (
              <button
                key={dis}
                onClick={() => changeDisease(dis)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition border font-mono ${
                  disease === dis
                    ? "border-[var(--bp-cyan)] text-[var(--bp-cyan)] bg-[rgba(0,255,255,0.08)]"
                    : "border-[var(--bp-line-faint)] text-[var(--bp-white-faint)] hover:text-[var(--bp-white-muted)]"
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
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold border border-[var(--bp-cyan)] border-dashed mb-3" style={{ color: 'var(--bp-cyan)' }}>
            🎯 PROOF OF FORECAST ACCURACY
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--bp-white-soft)' }}>
            {event?.event_name || `${districtName} ${diseaseLabel} Outbreak Backtest`}
          </h2>
          <p className="text-[10px] mt-1 max-w-3xl" style={{ color: 'var(--bp-white-faint)' }}>
            To prove forecast reliability, the model is trained exclusively on historical data up to the cutoff
            {cutoffDate ? ` (${cutoffDate})` : ""} and its forward projections are then evaluated against actual
            recorded case counts. MAE, RMSE and peak timing are computed live from the comparison — nothing is pre-baked.
          </p>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="bp-serial mb-1">[MET-01] OUTBREAK LEAD TIME</p>
            <p className="text-3xl font-bold font-mono" style={{ color: 'var(--bp-cyan)' }}>
              {loading ? "Loading..." : leadTime !== undefined ? `${leadTime} Wks` : "N/A"}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>Model peak vs actual peak gap</p>
            {predictedPeak && event && (
              <p className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--bp-white-faint)' }}>
                Predicted peak {predictedPeak}
              </p>
            )}
          </div>

          <div className="stat-card">
            <p className="bp-serial mb-1">[MET-02] ACTUAL OUTBREAK PEAK</p>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--bp-white-soft)' }}>
              {loading ? "Loading..." : event?.actual_peak_week || "N/A"}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>Recorded peak week</p>
          </div>

          <div className="stat-card">
            <p className="bp-serial mb-1">[MET-03] MAE</p>
            <p className="text-3xl font-bold font-mono" style={{ color: 'var(--bp-white-muted)' }}>
              {loading ? "Loading..." : event?.metrics_json?.mae !== undefined ? event.metrics_json.mae : "N/A"}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>Average case deviation (cases)</p>
          </div>

          <div className="stat-card">
            <p className="bp-serial mb-1">[MET-04] RMSE</p>
            <p className="text-3xl font-bold font-mono" style={{ color: 'var(--bp-cyan-dim)' }}>
              {loading ? "Loading..." : event?.metrics_json?.rmse !== undefined ? event.metrics_json.rmse : "N/A"}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>Root Mean Square Error (cases)</p>
          </div>
        </section>

        {/* Chart View */}
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
              <span className="bp-serial">[CHT-01]</span> Predicted Outbreak Curve vs Actual Recorded Outcome
            </h3>
            <span className="bp-coord">Cyan = Model Forecast • Redline = Actual Recorded</span>
          </div>

          {loading ? (
            <div className="h-[360px] flex items-center justify-center text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>Running live backtest for {districtName} ({diseaseLabel})...</div>
          ) : !event ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-[10px] gap-2" style={{ color: 'var(--bp-white-faint)' }}>
              <span className="text-2xl">⚠️</span>
              <p className="font-bold">No backtest available for this selection</p>
              <p className="text-center max-w-md">
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
            <div className="mt-3 pt-3 border-t border-[var(--bp-line-faint)] flex flex-wrap gap-4 text-[9px] font-mono" style={{ color: 'var(--bp-white-faint)' }}>
              <span>Training cutoff: <span style={{ color: 'var(--bp-cyan)' }}>{cutoffDate}</span></span>
              <span>Actual peak: <span style={{ color: 'var(--bp-white-soft)' }}>{event.actual_peak_week}</span></span>
              {predictedPeak && <span>Predicted peak: <span style={{ color: 'var(--bp-cyan)' }}>{predictedPeak}</span></span>}
              <span>Held-out weeks: <span style={{ color: 'var(--bp-white-muted)' }}>{event.metrics_json.weeks.length}</span></span>
            </div>
          )}
        </section>

        {/* Source Traceability Table */}
        <section className="blueprint-card p-6">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--bp-white-soft)' }}>
            <span className="bp-serial">[TBL-01]</span> Pitch Claim Traceability
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-[var(--bp-line-faint)] text-left" style={{ color: 'var(--bp-white-muted)' }}>
                  <th className="py-2">CLAIM</th>
                  <th className="py-2">PROVEN VALUE</th>
                  <th className="py-2">SOURCE ARTIFACT POINTER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bp-line-faint)]">
                <tr>
                  <td className="py-2.5" style={{ color: 'var(--bp-white-muted)' }}>&quot;Backtested forecast accuracy&quot;</td>
                  <td className="py-2.5" style={{ color: 'var(--bp-cyan)' }}>
                    {event ? `MAE ${event.metrics_json.mae} • RMSE ${event.metrics_json.rmse}` : "N/A"}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--bp-white-faint)' }}>Supabase `backtest_runs` (live HGB+XGBoost backtest)</td>
                </tr>
                <tr>
                  <td className="py-2.5" style={{ color: 'var(--bp-white-muted)' }}>&quot;Model pins outbreak peak timing&quot;</td>
                  <td className="py-2.5" style={{ color: 'var(--bp-cyan)' }}>
                    {event ? `Predicted peak within ${leadTime} wks of actual (${event.actual_peak_week})` : "N/A"}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--bp-white-faint)' }}>Computed from `case_data` vs model forward projection</td>
                </tr>
                <tr>
                  <td className="py-2.5" style={{ color: 'var(--bp-white-muted)' }}>&quot;Climate-aware residual predictions&quot;</td>
                  <td className="py-2.5" style={{ color: 'var(--bp-cyan)' }}>Rainfall &amp; Temp Lags</td>
                  <td className="py-2.5" style={{ color: 'var(--bp-white-faint)' }}>ml/results/shap_importance.json</td>
                </tr>
                <tr>
                  <td className="py-2.5" style={{ color: 'var(--bp-white-muted)' }}>&quot;Verified IDSP surveillance data&quot;</td>
                  <td className="py-2.5" style={{ color: 'var(--bp-cyan)' }}>IDSP Baseline Surveillance DB</td>
                  <td className="py-2.5" style={{ color: 'var(--bp-white-faint)' }}>data/data_manifest.json</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
