"use client";

import { useState, useEffect } from "react";
import {
  submitSymptomReport,
  evaluateTriageOnly,
  fetchLivestockDistricts,
  LivestockDistrict,
  SymptomReportCreate,
  TriageResult,
} from "@/lib/livestock-api";
import {
  SYMPTOM_KEYS,
  MAHARASHTRA_BLOCKS,
  SPECIES_OPTIONS,
  Lang,
  t,
} from "@/lib/livestock-i18n";
import MorphIcon from "@/app/components/MorphIcon";

const SEVERITY_OPTIONS = ["mild", "moderate", "severe", "mass_mortality"];
const REPORTER_TYPES = [
  "farmer",
  "para_vet",
  "field_vet",
  "livestock_inspector",
  "panchayat_member",
];

export default function ReportPage() {
  const [lang] = useState<Lang>("en");
  const [districts, setDistricts] = useState<LivestockDistrict[]>([]);
  const [form, setForm] = useState<Partial<SymptomReportCreate>>({
    district_id: "",
    block: "",
    village: "",
    species: "cattle",
    num_affected: 1,
    num_dead: 0,
    symptoms: [],
    severity: "moderate",
    reporter_type: "farmer",
    language: "en",
  });
  const [triagePreview, setTriagePreview] = useState<TriageResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<SymptomReportCreate[]>([]);

  useEffect(() => {
    fetchLivestockDistricts().then(setDistricts).catch(console.error);
    try {
      const q = localStorage.getItem("pashuraksha_offline_queue");
      if (q) setOfflineQueue(JSON.parse(q));
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-run triage preview when symptoms change (FR-6)
  useEffect(() => {
    if ((form.symptoms?.length ?? 0) >= 2 && form.species) {
      const timer = setTimeout(async () => {
        const preview = await evaluateTriageOnly(form as SymptomReportCreate);
        setTriagePreview(preview);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setTriagePreview(null);
    }
  }, [form.symptoms, form.species, form.num_dead, form.severity]);

  const toggleSymptom = (s: string) => {
    const current = form.symptoms || [];
    setForm({
      ...form,
      symptoms: current.includes(s) ? current.filter((x) => x !== s) : [...current, s],
    });
  };

  const handleSubmit = async () => {
    if (!form.district_id || !form.block || !form.village || !form.symptoms?.length) {
      setError("Please fill required fields: district, block, village, and at least one clinical symptom.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const report = await submitSymptomReport(form as SymptomReportCreate);
      setSubmitted(report.report_id);
      setForm({
        district_id: form.district_id,
        block: "",
        village: "",
        species: "cattle",
        num_affected: 1,
        num_dead: 0,
        symptoms: [],
        severity: "moderate",
        reporter_type: form.reporter_type,
        language: lang,
      });
      setTriagePreview(null);
    } catch {
      // Queue offline per PRD §8
      const offlineReport = { ...form, offline_synced: false } as SymptomReportCreate;
      const newQueue = [...offlineQueue, offlineReport];
      setOfflineQueue(newQueue);
      try {
        localStorage.setItem("pashuraksha_offline_queue", JSON.stringify(newQueue));
      } catch {
        /* ignore */
      }
      setSubmitted(`OFFLINE-QUEUED (${newQueue.length} pending sync)`);
    } finally {
      setSubmitting(false);
    }
  };

  const blocks = form.district_id ? MAHARASHTRA_BLOCKS[form.district_id] || [] : [];

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
          📋 {t(lang, "nav_report")}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Pashu Sakhi &amp; field-worker livestock disease reporting with offline persistence
        </p>
      </div>

      {/* ── Confirmed Persistence Success Banner (transitions.dev t-success-check) ── */}
      {submitted && (
        <div
          className="t-success-check p-4 rounded-lg flex items-start gap-3"
          style={{
            background: "rgba(22, 163, 74, 0.08)",
            boxShadow: "0 0 0 1px var(--success)",
          }}
        >
          <div className="mt-0.5">
            <MorphIcon state="check" size={20} color="var(--success)" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
              {submitted.startsWith("OFFLINE")
                ? "Report Persisted to Local Offline Cache"
                : "Report Successfully Persisted & Synchronized"}
            </p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--fg-2)" }}>
              Report ID: {submitted}
            </p>
          </div>
        </div>
      )}

      {/* ── Offline Queue Indicator ── */}
      {offlineQueue.length > 0 && (
        <div
          className="p-3 rounded-lg flex items-center justify-between"
          style={{
            background: "rgba(234, 179, 8, 0.1)",
            boxShadow: "0 0 0 1px var(--warn)",
          }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--warn)" }}>
            📶 {offlineQueue.length} report{offlineQueue.length > 1 ? "s" : ""} cached locally
          </span>
          <button
            className="ew-btn-compact text-xs"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            Sync Now
          </button>
        </div>
      )}

      {/* ── Validation Error Shake Container (t-error-state-shake) ── */}
      {error && (
        <div
          className="t-error-state-shake p-3 rounded-lg flex items-center gap-2"
          style={{
            background: "rgba(220, 38, 38, 0.08)",
            color: "var(--danger)",
          }}
        >
          <span className="text-sm">⚠️</span>
          <span className="text-xs font-semibold">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Location Fieldset ── */}
        <fieldset className="ew-card p-5 space-y-4">
          <legend className="ew-eyebrow px-1 font-bold" style={{ color: "var(--accent)" }}>
            📍 Geographic Location
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                {t(lang, "form_district")} *
              </label>
              <select
                value={form.district_id}
                onChange={(e) => setForm({ ...form, district_id: e.target.value, block: "" })}
                className="ew-select text-xs"
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                {t(lang, "form_block")} *
              </label>
              <select
                value={form.block}
                onChange={(e) => setForm({ ...form, block: e.target.value })}
                className="ew-select text-xs"
              >
                <option value="">Select Tehsil/Block</option>
                {blocks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                {t(lang, "form_village")} *
              </label>
              <input
                type="text"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                placeholder="Village name / Gram Panchayat"
                className="ew-input text-xs"
              />
            </div>
          </div>
        </fieldset>

        {/* ── Animal & Herd Details ── */}
        <fieldset className="ew-card p-5 space-y-4">
          <legend className="ew-eyebrow px-1 font-bold" style={{ color: "var(--accent)" }}>
            🐄 Species &amp; Morbidity Counts
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                Target Species
              </label>
              <select
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
                className="ew-select text-xs"
              >
                {SPECIES_OPTIONS.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp.charAt(0).toUpperCase() + sp.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                Affected Animals
              </label>
              <input
                type="number"
                min="1"
                value={form.num_affected}
                onChange={(e) => setForm({ ...form, num_affected: parseInt(e.target.value) || 1 })}
                className="ew-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                Mortalities (Dead)
              </label>
              <input
                type="number"
                min="0"
                value={form.num_dead}
                onChange={(e) => setForm({ ...form, num_dead: parseInt(e.target.value) || 0 })}
                className="ew-input text-xs"
              />
            </div>
          </div>
        </fieldset>

        {/* ── Clinical Symptoms ── */}
        <fieldset className="ew-card p-5 space-y-3">
          <legend className="ew-eyebrow px-1 font-bold" style={{ color: "var(--accent)" }}>
            🩺 Observed Symptoms (Select All That Apply)
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {SYMPTOM_KEYS.map((s) => {
              const isSelected = form.symptoms?.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className="ew-btn-compact justify-start text-xs text-left"
                  style={{
                    height: 38,
                    borderRadius: "var(--radius-sm)",
                    background: isSelected ? "rgba(79, 110, 247, 0.08)" : "var(--surface)",
                    boxShadow: isSelected
                      ? "0 0 0 1.5px var(--accent)"
                      : "var(--shadow-border)",
                    color: isSelected ? "var(--accent)" : "var(--fg)",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span className="text-sm">{isSelected ? "✓" : "+"}</span>
                  <span className="truncate">{s.replace(/_/g, " ")}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ── Reporter & Severity ── */}
        <fieldset className="ew-card p-5 space-y-4">
          <legend className="ew-eyebrow px-1 font-bold" style={{ color: "var(--accent)" }}>
            👤 Reporter Information
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                Reporter Role
              </label>
              <select
                value={form.reporter_type}
                onChange={(e) => setForm({ ...form, reporter_type: e.target.value })}
                className="ew-select text-xs"
              >
                {REPORTER_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt.replace(/_/g, " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg-2)" }}>
                Field Severity Rating
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="ew-select text-xs"
              >
                {SEVERITY_OPTIONS.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev.replace(/_/g, " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* ── FR-6 Triage Preview (Guardrail 5: Never uses t-success-check celebration) ── */}
        {triagePreview && (
          <div
            className="ew-card p-5 space-y-2"
            style={{
              background: "var(--surface)",
              boxShadow: triagePreview.alert_recommended
                ? "0 0 0 1.5px var(--danger)"
                : "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--fg)" }}>
                🔍 AI Clinical Triage Advisory
              </h3>
              {triagePreview.alert_recommended && (
                <span
                  className="ew-badge ew-badge--critical text-[10px]"
                  style={{ borderRadius: "var(--radius-pill)" }}
                >
                  Outbreak Alert Triggered
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "var(--fg-2)" }}>
              {triagePreview.triage_notes}
            </p>

            {triagePreview.suspected_diseases.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {triagePreview.suspected_diseases.map((d) => (
                  <span
                    key={d.disease_id}
                    className="text-xs px-2.5 py-1 rounded-md"
                    style={{
                      background: "var(--surface-muted)",
                      boxShadow: "var(--shadow-border)",
                      color: "var(--fg)",
                    }}
                  >
                    <span className="font-semibold">{d.name}</span>{" "}
                    <span className="font-mono text-[11px] text-gray-500">
                      ({(d.confidence * 100).toFixed(0)}%)
                    </span>
                    {d.notifiable && (
                      <span className="font-bold text-red-600 ml-1">⚠ Notifiable</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Submit Section (FR-5, FR-6 & Strict No-Pill Rules) ── */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="ew-btn-primary w-full text-sm font-bold"
            style={{
              height: 48,
              borderRadius: "var(--radius-md)",
            }}
          >
            <MorphIcon
              state={submitting ? "spinner" : submitted ? "check" : "spinner"}
              size={18}
              color="#FFFFFF"
            />
            <span>{submitting ? "Persisting to Surveillance DB..." : "Submit Verified Field Report"}</span>
          </button>

          {/* Part 4 & 5: Mandatory --text-sm Safety Label Directly Beneath Button */}
          <p
            className="text-sm mt-2.5 text-center leading-normal"
            style={{ color: "var(--muted)" }}
          >
            Screening &amp; triage advisory only — not a definitive veterinary diagnosis. Field verification required.
          </p>
        </div>
      </div>
    </div>
  );
}
