"use client";

import { useEffect, useState } from "react";
import { fetchPrecautions, Precaution } from "@/lib/api-client";

export default function PrecautionPanel({ diseaseId }: { diseaseId: string }) {
  const [data, setData] = useState<Precaution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const res = await fetchPrecautions(diseaseId);
      if (active) {
        setData(res);
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [diseaseId]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16] flex items-center justify-center h-[200px]">
        <div className="text-slate-500 animate-pulse text-sm">Loading precautionary measures...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16] flex flex-col items-center justify-center h-[200px] text-slate-500 gap-2">
        <span className="text-2xl">🛡️</span>
        <p className="text-sm font-semibold">No precautions listed</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            4. Precautionary Measures & Guidance
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Actionable steps tailored for {diseaseId.toUpperCase()}.
          </p>
        </div>
        {data.seasonal_window && (
          <div className="px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[10px] font-mono tracking-widest">
            {data.seasonal_window.toUpperCase()} ALERT
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Column 1: Before it happens */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <span className="text-lg">🛡️</span>
            <h4 className="font-semibold text-sm">Before it happens</h4>
          </div>
          <div className="space-y-3">
            {data.individual_precautions && data.individual_precautions.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-2">Individual Action</p>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                  {data.individual_precautions.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {data.community_precautions && data.community_precautions.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-4 mb-2">Community Action</p>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                  {data.community_precautions.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Warning signs */}
        <div className="space-y-4 md:border-l border-slate-800 md:pl-6">
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <span className="text-lg">⚠️</span>
            <h4 className="font-semibold text-sm">Warning Signs</h4>
          </div>
          <div className="space-y-3">
            {data.early_warning_symptoms && data.early_warning_symptoms.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-2">Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {data.early_warning_symptoms.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300/80 text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.high_risk_groups && data.high_risk_groups.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-4 mb-2">High Risk Groups</p>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                  {data.high_risk_groups.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: If it happens */}
        <div className="space-y-4 md:border-l border-slate-800 md:pl-6">
          <div className="flex items-center gap-2 text-rose-400 mb-3">
            <span className="text-lg">🚑</span>
            <h4 className="font-semibold text-sm">If it happens</h4>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400 mb-2">Seek immediate medical attention if warning signs appear.</p>
              {data.govt_helpline && (
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    📞
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Govt Helpline</p>
                    <p className="font-mono text-white text-sm">{data.govt_helpline}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
