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
      <div className="blueprint-card p-6 flex items-center justify-center h-[200px]">
        <div className="text-[10px] font-mono" style={{ color: 'var(--bp-white-faint)', animation: 'bp-pulse 2s ease-in-out infinite' }}>Loading precautionary measures...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="blueprint-card p-6 flex flex-col items-center justify-center h-[200px] gap-2">
        <span className="text-2xl">🛡️</span>
        <p className="text-xs font-bold" style={{ color: 'var(--bp-white-muted)' }}>No precautions listed</p>
      </div>
    );
  }

  return (
    <div className="blueprint-card p-6">
      <div className="bp-corners">
        <span className="corner-tr">+</span>
        <span className="corner-bl">+</span>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-2">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
            <span className="bp-serial">[SEC-04]</span> Precautionary Measures &amp; Guidance
          </h3>
          <p className="text-[10px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>
            Actionable steps tailored for {diseaseId.toUpperCase()}.
          </p>
        </div>
        {data.seasonal_window && (
          <div className="px-3 py-1 border border-dashed text-[9px] font-mono tracking-widest uppercase" style={{ borderColor: 'var(--bp-redline)', color: 'var(--bp-redline)' }}>
            {data.seasonal_window.toUpperCase()} ALERT
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Column 1: Before it happens */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--bp-cyan)' }}>
            <span className="text-lg">🛡️</span>
            <h4 className="font-bold text-xs uppercase tracking-wider">Before It Happens</h4>
          </div>
          <div className="space-y-3">
            {data.individual_precautions && data.individual_precautions.length > 0 && (
              <div>
                <p className="bp-serial mb-2">INDIVIDUAL ACTION</p>
                <ul className="text-[10px] space-y-2 list-none pl-0" style={{ color: 'var(--bp-white-muted)' }}>
                  {data.individual_precautions.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span style={{ color: 'var(--bp-cyan)' }}>+</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.community_precautions && data.community_precautions.length > 0 && (
              <div>
                <p className="bp-serial mt-4 mb-2">COMMUNITY ACTION</p>
                <ul className="text-[10px] space-y-2 list-none pl-0" style={{ color: 'var(--bp-white-muted)' }}>
                  {data.community_precautions.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span style={{ color: 'var(--bp-cyan)' }}>+</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Warning signs */}
        <div className="space-y-4 md:border-l border-[var(--bp-line-faint)] md:pl-6">
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--bp-redline)' }}>
            <span className="text-lg">⚠️</span>
            <h4 className="font-bold text-xs uppercase tracking-wider">Warning Signs</h4>
          </div>
          <div className="space-y-3">
            {data.early_warning_symptoms && data.early_warning_symptoms.length > 0 && (
              <div>
                <p className="bp-serial mb-2">SYMPTOMS</p>
                <div className="flex flex-wrap gap-2">
                  {data.early_warning_symptoms.map((s, i) => (
                    <span key={i} className="px-2 py-1 border text-[10px] font-mono" style={{ borderColor: 'var(--bp-redline)', color: 'var(--bp-redline)', borderStyle: 'dashed' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.high_risk_groups && data.high_risk_groups.length > 0 && (
              <div>
                <p className="bp-serial mt-4 mb-2">HIGH RISK GROUPS</p>
                <ul className="text-[10px] space-y-2 list-none pl-0" style={{ color: 'var(--bp-white-muted)' }}>
                  {data.high_risk_groups.map((g, i) => (
                    <li key={i} className="flex gap-2">
                      <span style={{ color: 'var(--bp-redline)' }}>+</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: If it happens */}
        <div className="space-y-4 md:border-l border-[var(--bp-line-faint)] md:pl-6">
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--bp-white-soft)' }}>
            <span className="text-lg">🚑</span>
            <h4 className="font-bold text-xs uppercase tracking-wider">If It Happens</h4>
          </div>
          <div className="space-y-3">
            <div className="p-4 border border-[var(--bp-line-faint)]">
              <p className="text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>Seek immediate medical attention if warning signs appear.</p>
              {data.govt_helpline && (
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--bp-line-faint)]">
                  <div className="w-8 h-8 border border-[var(--bp-cyan)] flex items-center justify-center" style={{ color: 'var(--bp-cyan)' }}>
                    📞
                  </div>
                  <div>
                    <p className="bp-serial">GOVT HELPLINE</p>
                    <p className="font-mono text-sm" style={{ color: 'var(--bp-white)' }}>{data.govt_helpline}</p>
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
