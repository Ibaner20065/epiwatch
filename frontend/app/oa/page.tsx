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
    <div className="flex flex-col min-h-screen text-[var(--bp-white-soft)] font-mono relative">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] px-6 py-4 backdrop-blur-md" style={{ background: "rgba(0, 30, 60, 0.9)" }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 border border-[var(--bp-line-faint)] flex items-center justify-center text-lg hover:border-[var(--bp-cyan)] transition">
              ←
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-widest uppercase" style={{ color: "var(--bp-cyan)" }}>
                {t().app}
              </h1>
              <p className="text-[10px] tracking-wider" style={{ color: "var(--bp-white-muted)" }}>
                <span className="bp-serial">[OA-001]</span> {t().sub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-faint)" }}>
              {t().language}:
            </span>
            <div className="flex items-center gap-1 p-1 border border-[var(--bp-line-faint)]">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest transition ${
                    lang === l.code ? "border border-[var(--bp-cyan)] text-[var(--bp-cyan)] bg-[rgba(0,255,255,0.08)]" : "text-[var(--bp-white-muted)]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Title bar */}
        <section className="blueprint-card p-6 animate-fade-up">
          <div className="bp-corners">
            <span className="corner-tr">+</span>
            <span className="corner-bl">+</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-[var(--bp-cyan)] border-dashed" style={{ color: "var(--bp-cyan)" }}>
                  <span className="w-2 h-2 bg-[var(--bp-cyan)]" style={{ animation: "bp-pulse 2s ease-in-out infinite" }} />
                  {t().app} · AI SCREENING ENGINE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-wider uppercase" style={{ color: "var(--bp-white-soft)" }}>
                {t().dashboard}
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--bp-white-muted)" }}>{t().tagline}</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="stat-card p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().model}</p>
                <p className="text-lg font-bold" style={{ color: modelStatus?.available ? "var(--bp-cyan)" : "var(--bp-redline)" }}>
                  {modelStatus ? (modelStatus.available ? "ONLINE" : "OFFLINE") : t().not_available}
                </p>
              </div>
              {gb && (
                <div className="stat-card p-3 text-center">
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>ROC-AUC</p>
                  <p className="text-lg font-bold" style={{ color: "var(--bp-cyan)" }}>
                    {Math.round((gb.roc_auc ?? 0) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Screening Form ─────────────────────────── */}
          <section className="blueprint-card p-6">
            <div className="bp-corners">
              <span className="corner-tr">+</span>
              <span className="corner-bl">+</span>
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: "var(--bp-white-soft)" }}>
              <span className="bp-serial">[FORM-01]</span> {t().patient}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().age}</span>
                <input type="number" value={form.age} onChange={(e) => setF("age", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().bmi}</span>
                <input type="number" step="0.1" value={form.bmi} onChange={(e) => setF("bmi", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().sex}</span>
                <select value={form.sex} onChange={(e) => setF("sex", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" style={{ background: "#001a33" }}>
                  <option value="female">{t().sex_female}</option>
                  <option value="male">{t().sex_male}</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().occupation}</span>
                <select value={form.occupation} onChange={(e) => setF("occupation", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" style={{ background: "#001a33" }}>
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o}>{t()["occ_" + o]}</option>
                  ))}
                </select>
              </label>
              <label className="block col-span-2">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().ner_district}</span>
                <select value={form.ner_district} onChange={(e) => setF("ner_district", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" style={{ background: "#001a33" }}>
                  {(regions?.regions ?? []).map((r) => (
                    <option key={r.code} value={r.code}>{r.name} — {r.state}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.injury} onChange={(e) => setF("injury", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().injury}</label>
              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.family} onChange={(e) => setF("family", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().family}</label>
              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.diabetes} onChange={(e) => setF("diabetes", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().diabetes}</label>
            </div>

            <div className="bp-divider mt-5 mb-5"><span>&lt;── {t().screening} ──&gt;</span></div>

            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().pain}</span>
                <input type="number" min="0" max="100" value={form.pain} onChange={(e) => setF("pain", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().stiffness}</span>
                <input type="number" min="0" max="100" value={form.stiffness} onChange={(e) => setF("stiffness", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().function}</span>
                <input type="number" min="0" max="100" value={form.function} onChange={(e) => setF("function", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().morning}</span>
                <input type="number" min="0" value={form.morning} onChange={(e) => setF("morning", e.target.value)} className="mt-1 w-full bg-transparent border border-[var(--bp-line-faint)] px-3 py-2 text-xs focus:border-[var(--bp-cyan)] outline-none" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.knee} onChange={(e) => setF("knee", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().knee}</label>
              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.hip} onChange={(e) => setF("hip", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().hip}</label>
              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.hand} onChange={(e) => setF("hand", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().hand}</label>
              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.spine} onChange={(e) => setF("spine", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().spine}</label>
              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.crepitus} onChange={(e) => setF("crepitus", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().crepitus}</label>
              <label className="flex items-center gap-2 text-[10px] cursor-pointer"><input type="checkbox" checked={form.swelling} onChange={(e) => setF("swelling", e.target.checked)} className="accent-[var(--bp-cyan)]" />{t().swelling}</label>
            </div>

            <button onClick={runScreening} disabled={loading} className={`bp-btn bp-btn-active w-full mt-6 py-3 text-xs font-extrabold ${loading ? "opacity-60" : ""}`}>
              {loading ? t().running : `⚡ ${t().run}`}
            </button>
            {error && <p className="text-[10px] mt-3" style={{ color: "var(--bp-redline)" }}>{error}</p>}
          </section>

          {/* ── Result Panel ─────────────────────────── */}
          <section className="blueprint-card p-6">
            <div className="bp-corners">
              <span className="corner-tr">+</span>
              <span className="corner-bl">+</span>
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: "var(--bp-white-soft)" }}>
              <span className="bp-serial">[RES-01]</span> {t().result}
            </h3>

            {!result ? (
              <div className="border border-dashed border-[var(--bp-line-faint)] p-8 text-center text-[10px]" style={{ color: "var(--bp-white-faint)" }}>
                [ AWAITING SCREENING INPUT — RUN AI SCREENING TO COMPUTE RISK ]
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--bp-white-muted)" }}>{t().probability}</p>
                    <p className="text-2xl font-bold" style={{ color: "var(--bp-cyan)" }}>
                      {Math.round(result.risk_probability * 100)}%
                    </p>
                  </div>
                  <RiskBadge tier={result.risk_tier} size="lg" />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: "var(--bp-white-muted)" }}>{t().source}</span>
                  <span className="bp-serial">{result.risk_source}</span>
                </div>

                <div className="pt-3 border-t border-[var(--bp-line-faint)]">
                  <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--bp-white-muted)" }}>{t().factors}</p>
                  <ul className="space-y-1.5">
                    {(Array.isArray(result.top_factors) ? result.top_factors : []).slice(0, 5).map((f, i) => {
                      const factor = typeof f === "string" ? { factor: f, value: "" } : f;
                      return (
                        <li key={i} className="flex items-center justify-between gap-2 text-[10px] border border-[var(--bp-line-faint)] px-3 py-1.5">
                          <span style={{ color: "var(--bp-white-soft)" }}>
                            <span className="bp-serial">[{String(i + 1).padStart(2, "0")}]</span> {factor.factor}
                          </span>
                          <span style={{ color: "var(--bp-cyan-dim)" }}>{factor.value}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[var(--bp-line-faint)]">
                  <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${result.referral_required ? "border border-[var(--bp-redline)] text-[var(--bp-redline)]" : "border border-[var(--bp-cyan)] text-[var(--bp-cyan)]"}`}>
                    {result.referral_required ? "REFER TO ORTHOPAEDIC CARE" : "MONITOR / SCREEN AGAIN"}
                  </span>
                </div>
              </div>
            )}

            <p className="text-[9px] mt-6 pt-3 border-t border-[var(--bp-line-faint)]" style={{ color: "var(--bp-white-faint)" }}>
              {t().disclaimer}
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--bp-line-faint)] px-6 py-6" style={{ background: "rgba(0, 20, 40, 0.8)" }}>
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px]" style={{ color: "var(--bp-white-faint)" }}>
          <p><strong style={{ color: "var(--bp-cyan)" }}>{t().app}</strong> — {t().sub}</p>
          <p className="bp-serial">OA RISK ENGINE • ML CLASSIFIER + CLINICAL RULES • SIH26004</p>
        </div>
      </footer>
    </div>
  );
}
