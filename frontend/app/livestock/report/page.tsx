"use client";

import { useState, useEffect } from "react";
import { submitSymptomReport, evaluateTriageOnly, fetchLivestockDistricts, LivestockDistrict, SymptomReportCreate, TriageResult } from "@/lib/livestock-api";
import { SYMPTOM_KEYS, MAHARASHTRA_BLOCKS, SPECIES_OPTIONS, Lang, t } from "@/lib/livestock-i18n";

const SEVERITY_OPTIONS = ["mild", "moderate", "severe", "mass_mortality"];
const REPORTER_TYPES = ["farmer", "para_vet", "field_vet", "livestock_inspector", "panchayat_member"];

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
    // Load offline queue from localStorage
    try {
      const q = localStorage.getItem("pashuraksha_offline_queue");
      if (q) setOfflineQueue(JSON.parse(q));
    } catch { /* ignore */ }
  }, []);

  // Auto-run triage preview when symptoms change
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
    if (!form.district_id || !form.block || !form.village || !(form.symptoms?.length)) {
      setError("Please fill required fields: district, block, village, and at least one symptom.");
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
      // Queue offline
      const offlineReport = { ...form, offline_synced: false } as SymptomReportCreate;
      const newQueue = [...offlineQueue, offlineReport];
      setOfflineQueue(newQueue);
      localStorage.setItem("pashuraksha_offline_queue", JSON.stringify(newQueue));
      setSubmitted(`OFFLINE-QUEUED (${newQueue.length} pending)`);
    } finally {
      setSubmitting(false);
    }
  };

  const blocks = form.district_id ? MAHARASHTRA_BLOCKS[form.district_id] || [] : [];

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#d4af37" }}>
        📋 {t(lang, "nav_report")}
      </h1>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
        Report animal disease symptoms or mortality events
      </p>

      {/* Success banner */}
      {submitted && (
        <div className="mb-6 p-4 rounded-xl" style={{
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
        }}>
          <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>
            ✅ {t(lang, submitted.startsWith("OFFLINE") ? "form_offline_queued" : "form_success")}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Report ID: {submitted}
          </p>
        </div>
      )}

      {/* Offline queue indicator */}
      {offlineQueue.length > 0 && (
        <div className="mb-4 p-3 rounded-lg flex items-center justify-between" style={{
          background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
        }}>
          <span className="text-xs" style={{ color: "#eab308" }}>
            📶 {offlineQueue.length} report{offlineQueue.length > 1 ? "s" : ""} queued offline
          </span>
          <button className="text-xs px-3 py-1 rounded" style={{
            background: "rgba(234,179,8,0.2)", color: "#eab308",
          }}>
            Sync Now
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg" style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
        }}>
          <p className="text-xs" style={{ color: "#ef4444" }}>⚠️ {error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Location ────────────────────────────── */}
        <fieldset className="rounded-xl p-5" style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <legend className="text-sm font-semibold px-2" style={{ color: "#d4af37" }}>📍 Location</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_district")} *</label>
              <select
                value={form.district_id}
                onChange={(e) => setForm({ ...form, district_id: e.target.value, block: "" })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_block")} *</label>
              <select
                value={form.block}
                onChange={(e) => setForm({ ...form, block: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="">Select taluka</option>
                {blocks.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_village")} *</label>
              <input
                type="text"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                placeholder="Enter village name"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
        </fieldset>

        {/* ── Animal Info ─────────────────────────── */}
        <fieldset className="rounded-xl p-5" style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <legend className="text-sm font-semibold px-2" style={{ color: "#d4af37" }}>🐾 Animal Info</legend>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <div className="col-span-2">
              <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_species")} *</label>
              <div className="flex flex-wrap gap-2">
                {SPECIES_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, species: s })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: form.species === s ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)",
                      color: form.species === s ? "#d4af37" : "rgba(255,255,255,0.5)",
                      border: `1px solid ${form.species === s ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    {t(lang, `species_${s}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_num_affected")}</label>
              <input
                type="number"
                min={0}
                value={form.num_affected}
                onChange={(e) => setForm({ ...form, num_affected: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_num_dead")}</label>
              <input
                type="number"
                min={0}
                value={form.num_dead}
                onChange={(e) => setForm({ ...form, num_dead: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
        </fieldset>

        {/* ── Symptoms Checklist ──────────────────── */}
        <fieldset className="rounded-xl p-5" style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <legend className="text-sm font-semibold px-2" style={{ color: "#d4af37" }}>🩺 Symptoms *</legend>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {SYMPTOM_KEYS.map((s) => {
              const active = form.symptoms?.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className="text-left px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: active ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)",
                    color: active ? "#d4af37" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${active ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {active ? "✓ " : ""}{t(lang, `symptom_${s}`)}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ── Severity ───────────────────────────── */}
        <fieldset className="rounded-xl p-5" style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <legend className="text-sm font-semibold px-2" style={{ color: "#d4af37" }}>⚠️ Severity</legend>
          <div className="flex flex-wrap gap-2 mt-3">
            {SEVERITY_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setForm({ ...form, severity: s })}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: form.severity === s ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)",
                  color: form.severity === s ? "#d4af37" : "rgba(255,255,255,0.5)",
                  border: `1px solid ${form.severity === s ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {t(lang, `severity_${s}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── Reporter Info ──────────────────────── */}
        <fieldset className="rounded-xl p-5" style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <legend className="text-sm font-semibold px-2" style={{ color: "#d4af37" }}>👤 Reporter</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_reporter_type")}</label>
              <select
                value={form.reporter_type}
                onChange={(e) => setForm({ ...form, reporter_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {REPORTER_TYPES.map((r) => (
                  <option key={r} value={r}>{t(lang, `reporter_${r}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_reporter_name")}</label>
              <input
                type="text"
                value={form.reporter_name || ""}
                onChange={(e) => setForm({ ...form, reporter_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_reporter_phone")}</label>
              <input
                type="tel"
                value={form.reporter_phone || ""}
                onChange={(e) => setForm({ ...form, reporter_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t(lang, "form_description")}</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Additional observations..."
            />
          </div>
        </fieldset>

        {/* ── Triage Preview ─────────────────────── */}
        {triagePreview && (
          <div className="rounded-xl p-5" style={{
            background: triagePreview.alert_recommended ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${triagePreview.alert_recommended ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
          }}>
            <h3 className="text-sm font-semibold mb-2" style={{
              color: triagePreview.alert_recommended ? "#ef4444" : "#22c55e",
            }}>
              🔍 AI Triage Preview
            </h3>
            <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              {triagePreview.triage_notes}
            </p>
            {triagePreview.suspected_diseases.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {triagePreview.suspected_diseases.map((d) => (
                  <span key={d.disease_id} className="text-xs px-2 py-1 rounded" style={{
                    background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)",
                  }}>
                    {d.name} ({(d.confidence * 100).toFixed(0)}%)
                    {d.notifiable && <span style={{ color: "#ef4444" }}> ⚠ Notifiable</span>}
                  </span>
                ))}
              </div>
            )}
            {triagePreview.alert_recommended && (
              <p className="text-xs mt-2 font-semibold" style={{ color: "#ef4444" }}>
                ⚡ Alert will be auto-generated: {triagePreview.alert_reason}
              </p>
            )}
          </div>
        )}

        {/* ── Submit Button ──────────────────────── */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl text-sm font-bold tracking-wider transition-all"
          style={{
            background: submitting
              ? "rgba(212,175,55,0.2)"
              : "linear-gradient(135deg, #d4af37, #8b6914)",
            color: submitting ? "rgba(255,255,255,0.5)" : "#0a1628",
            boxShadow: submitting ? "none" : "0 4px 20px rgba(212,175,55,0.3)",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? t(lang, "form_submitting") : t(lang, "form_submit")}
        </button>
      </div>
    </div>
  );
}
