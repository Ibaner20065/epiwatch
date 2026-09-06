"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  submitOAScreening,
  fetchOAModelStatus,
  fetchOANerRegions,
  OAScreeningInput,
  OARiskResult,
  OAModelStatus,
  OANerRegions,
} from "@/lib/oa-api";
import { TRANSLATIONS, LANGS, Lang } from "@/lib/oa-i18n";
import RiskBadge from "@/app/components/RiskBadge";
import MorphIcon from "@/app/components/MorphIcon";

const OCCUPATIONS = ["agriculture", "domestic", "service", "trade", "retired"];

export default function OAPage() {
  const t = () => TRANSLATIONS[lang];
  const [lang, setLang] = useState<Lang>("en");
  const [result, setResult] = useState<OARiskResult | null>(null);
  const [modelStatus, setModelStatus] = useState<OAModelStatus | null>(null);
  const [regions, setRegions] = useState<OANerRegions | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    age: 58,
    sex: "female",
    bmi: 27,
    occupation: "agriculture",
    ner_district: "AS-KAMRUP",
    injury: false,
    family: false,
    diabetes: false,
    pain: 35,
    stiffness: 35,
    function: 30,
    knee: true,
    hip: false,
    hand: false,
    spine: false,
    crepitus: false,
    swelling: false,
    morning: 25,
  });

  useEffect(() => {
    fetchOAModelStatus().then(setModelStatus).catch(() => {});
    fetchOANerRegions().then(setRegions).catch(() => {});
  }, []);

  const setF = (k: keyof typeof form, v: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const runScreening = async () => {
    setLoading(true);
    setError(null);
    try {
      const input: OAScreeningInput = {
        patient: {
          age: Number(form.age),
          sex: form.sex,
          bmi: Number(form.bmi),
          occupation: form.occupation,
          activity_level: form.occupation === "agriculture" || form.occupation === "domestic" ? 2 : form.occupation === "trade" ? 1 : 0,
          prior_joint_injury: form.injury,
          family_history_oa: form.family,
          diabetes: form.diabetes,
          terrain_factor: 1.0,
          ner_district: form.ner_district,
          language: lang,
        },
        screening: {
          womac_pain: Number(form.pain),
          womac_stiffness: Number(form.stiffness),
          womac_function: Number(form.function),
          joint_knee: form.knee,
          joint_hip: form.hip,
          joint_hand: form.hand,
          joint_spine: form.spine,
          crepitus: form.crepitus,
          joint_swelling: form.swelling,
          morning_stiffness_min: Number(form.morning),
        },
      };
      const res = await submitOAScreening(input);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Screening failed");
    } finally {
      setLoading(false);
    }
  };

  const gb = modelStatus?.models?.gradient_boosting;

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "var(--font-sans)", background: "var(--surface-muted)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 px-6 py-4"
        style={{
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px var(--border)",
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="ew-btn-secondary text-sm no-underline flex items-center justify-center"
              style={{ width: 36, height: 36, padding: 0, borderRadius: "var(--radius-md)" }}
            >
              ←
            </Link>
            <div>
              <h1 className="text-base font-bold" style={{ color: "var(--fg)" }}>
                {t().app}
              </h1>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                <span className="font-mono font-semibold text-blue-600">[OA-001]</span> {t().sub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              {t().language}:
            </span>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-md border border-gray-200">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded transition ${
                    lang === l.code
                      ? "bg-white text-blue-600 shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Title bar */}
        <section
          className="ew-card p-6"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded"
                  style={{ background: "rgba(37, 99, 235, 0.08)", color: "var(--accent)" }}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  {t().app} · AI Screening Engine
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                {t().dashboard}
              </h2>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--fg-2)" }}>
                {t().tagline}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <div
                className="p-3 text-center rounded-lg bg-gray-50 border border-gray-200 min-w-[120px]"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{t().model}</p>
                <p
                  className="text-base font-bold mt-0.5"
                  style={{ color: modelStatus?.available ? "#16a34a" : "#dc2626" }}
                >
                  {modelStatus ? (modelStatus.available ? "ONLINE" : "OFFLINE") : t().not_available}
                </p>
              </div>
              {gb && (
                <div
                  className="p-3 text-center rounded-lg bg-gray-50 border border-gray-200 min-w-[120px]"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">ROC-AUC</p>
                  <p className="text-base font-bold mt-0.5" style={{ color: "var(--accent)" }}>
                    {Math.round((gb.roc_auc ?? 0) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Screening Form ─────────────────────────── */}
          <section
            className="ew-card p-6"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "var(--fg)" }}>
              <span className="font-mono text-blue-600">[FORM-01]</span> {t().patient}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">{t().age}</span>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setF("age", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                  style={{ borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">{t().bmi}</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.bmi}
                  onChange={(e) => setF("bmi", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                  style={{ borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">{t().sex}</span>
                <select
                  value={form.sex}
                  onChange={(e) => setF("sex", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition cursor-pointer"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  <option value="female">{t().sex_female}</option>
                  <option value="male">{t().sex_male}</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">{t().occupation}</span>
                <select
                  value={form.occupation}
                  onChange={(e) => setF("occupation", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition cursor-pointer"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o}>{t()["occ_" + o]}</option>
                  ))}
                </select>
              </label>
              <label className="block col-span-2">
                <span className="text-xs font-semibold text-gray-700">{t().ner_district}</span>
                <select
                  value={form.ner_district}
                  onChange={(e) => setF("ner_district", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition cursor-pointer"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  {(regions?.regions ?? []).map((r) => (
                    <option key={r.code} value={r.code}>{r.name} — {r.state}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.injury}
                  onChange={(e) => setF("injury", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().injury}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.family}
                  onChange={(e) => setF("family", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().family}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.diabetes}
                  onChange={(e) => setF("diabetes", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().diabetes}
              </label>
            </div>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <span className="relative bg-white px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                {t().screening}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">{t().pain} (0-100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.pain}
                  onChange={(e) => setF("pain", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                  style={{ borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">{t().stiffness} (0-100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.stiffness}
                  onChange={(e) => setF("stiffness", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                  style={{ borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">{t().function} (0-100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.function}
                  onChange={(e) => setF("function", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                  style={{ borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">{t().morning} (min)</span>
                <input
                  type="number"
                  min="0"
                  value={form.morning}
                  onChange={(e) => setF("morning", e.target.value)}
                  className="mt-1 w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                  style={{ borderRadius: "var(--radius-sm)" }}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.knee}
                  onChange={(e) => setF("knee", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().knee}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hip}
                  onChange={(e) => setF("hip", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().hip}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hand}
                  onChange={(e) => setF("hand", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().hand}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.spine}
                  onChange={(e) => setF("spine", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().spine}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.crepitus}
                  onChange={(e) => setF("crepitus", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().crepitus}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.swelling}
                  onChange={(e) => setF("swelling", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                {t().swelling}
              </label>
            </div>

            <button
              onClick={runScreening}
              disabled={loading}
              className={`ew-btn-primary w-full mt-6 py-3 text-xs font-bold flex items-center justify-center gap-2 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <MorphIcon state={loading ? "spinner" : "search"} size={16} />
              {loading ? t().running : t().run}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-2 font-medium">
              Screening tool strictly for health worker decision support.
            </p>
            {error && (
              <p className="text-xs font-semibold text-red-600 mt-3 p-2 bg-red-50 rounded border border-red-200">
                {error}
              </p>
            )}
          </section>

          {/* ── Result Panel ─────────────────────────── */}
          <section
            className="ew-card p-6 flex flex-col justify-between"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "var(--fg)" }}>
                <span className="font-mono text-blue-600">[RES-01]</span> {t().result}
              </h3>

              {!result ? (
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <span className="text-3xl">🩺</span>
                  <p className="font-semibold text-gray-700">Awaiting Clinical Screening Input</p>
                  <p className="max-w-xs text-gray-500">
                    Fill out patient demographics and symptoms, then run the AI screening classifier to calculate risk tier.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-up">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t().probability}</p>
                      <p className="text-3xl font-extrabold font-mono text-gray-900 mt-1">
                        {Math.round(result.risk_probability * 100)}%
                      </p>
                    </div>
                    <RiskBadge tier={result.risk_tier} size="lg" />
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 px-1 border-b border-gray-100">
                    <span className="font-medium text-gray-600">{t().source}</span>
                    <span className="font-mono font-bold text-gray-900">{result.risk_source}</span>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-700">{t().factors}</p>
                    <ul className="space-y-2">
                      {(Array.isArray(result.top_factors) ? result.top_factors : []).slice(0, 5).map((f, i) => {
                        const factor = typeof f === "string" ? { factor: f, value: "" } : f;
                        return (
                          <li
                            key={i}
                            className="flex items-center justify-between gap-2 text-xs bg-gray-50 border border-gray-200 px-3 py-2 rounded"
                            style={{ borderRadius: "var(--radius-sm)" }}
                          >
                            <span className="font-medium text-gray-800">
                              <span className="font-mono font-bold text-blue-600 mr-1.5">
                                #{String(i + 1).padStart(2, "0")}
                              </span>
                              {factor.factor}
                            </span>
                            <span className="font-mono font-bold text-blue-700">{factor.value}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <div
                      className={`p-3 rounded text-xs font-bold uppercase tracking-wider text-center ${
                        result.referral_required
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                      style={{ borderRadius: "var(--radius-md)" }}
                    >
                      {result.referral_required
                        ? "🚨 Refer to District Orthopaedic Specialist"
                        : "✓ Primary Level Monitoring — Community Follow-up"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] leading-relaxed mt-6 pt-4 border-t border-gray-200 text-gray-500">
              {t().disclaimer}
            </p>
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-6 border-t border-gray-200 mt-8"
        style={{ background: "var(--surface)" }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>
            <strong className="text-gray-900">{t().app}</strong> — {t().sub}
          </p>
          <p className="font-mono text-gray-500">
            OA RISK ENGINE • ML CLASSIFIER + CLINICAL RULES • SIH26004
          </p>
        </div>
      </footer>
    </div>
  );
}
