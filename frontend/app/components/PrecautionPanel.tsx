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
      <div className="ew-card p-6 flex items-center justify-center h-[200px]">
        <div className="skeleton w-48 h-3 rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ew-card p-6 flex flex-col items-center justify-center h-[200px] gap-3">
        <span className="text-2xl">🛡️</span>
        <p className="text-sm font-medium" style={{ color: 'var(--body-text)' }}>No precautions listed</p>
      </div>
    );
  }

  return (
    <div className="ew-card p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-2">
        <div>
          <span className="ew-eyebrow">Precautionary Measures</span>
          <h3 className="text-base font-semibold mt-1" style={{ color: 'var(--ink)' }}>
            Guidance for {diseaseId.charAt(0).toUpperCase() + diseaseId.slice(1)}
          </h3>
        </div>
        {data.seasonal_window && (
          <span className="ew-badge ew-badge--high text-[10px]">
            {data.seasonal_window.toUpperCase()} Season
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Column 1: Before it happens */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--brand-start)' }}>
            <div className="ew-icon-circle" style={{ background: 'rgba(79, 110, 247, 0.08)' }}>
              🛡️
            </div>
            <h4 className="font-semibold text-sm">Before It Happens</h4>
          </div>
          <div className="space-y-3">
            {data.individual_precautions && data.individual_precautions.length > 0 && (
              <div>
                <p className="ew-eyebrow mb-2">Individual Action</p>
                <ul className="text-sm space-y-2 list-none pl-0" style={{ color: 'var(--body-text)' }}>
                  {data.individual_precautions.map((p, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="mt-0.5 text-sm" style={{ color: 'var(--brand-start)' }}>✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.community_precautions && data.community_precautions.length > 0 && (
              <div>
                <p className="ew-eyebrow mt-4 mb-2">Community Action</p>
                <ul className="text-sm space-y-2 list-none pl-0" style={{ color: 'var(--body-text)' }}>
                  {data.community_precautions.map((p, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="mt-0.5 text-sm" style={{ color: 'var(--brand-start)' }}>✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Warning signs */}
        <div className="space-y-4 md:border-l md:pl-6" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--risk-high)' }}>
            <div className="ew-icon-circle" style={{ background: 'rgba(234, 88, 12, 0.08)' }}>
              ⚠️
            </div>
            <h4 className="font-semibold text-sm">Warning Signs</h4>
          </div>
          <div className="space-y-3">
            {data.early_warning_symptoms && data.early_warning_symptoms.length > 0 && (
              <div>
                <p className="ew-eyebrow mb-2">Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {data.early_warning_symptoms.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 text-xs rounded-full font-medium" style={{ background: 'rgba(234, 88, 12, 0.08)', color: 'var(--risk-high)', border: '1px solid rgba(234, 88, 12, 0.15)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.high_risk_groups && data.high_risk_groups.length > 0 && (
              <div>
                <p className="ew-eyebrow mt-4 mb-2">High Risk Groups</p>
                <ul className="text-sm space-y-2 list-none pl-0" style={{ color: 'var(--body-text)' }}>
                  {data.high_risk_groups.map((g, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="mt-0.5" style={{ color: 'var(--risk-high)' }}>•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: If it happens */}
        <div className="space-y-4 md:border-l md:pl-6" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--ink)' }}>
            <div className="ew-icon-circle" style={{ background: 'var(--surface-muted)' }}>
              🚑
            </div>
            <h4 className="font-semibold text-sm">If It Happens</h4>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--body-text)' }}>Seek immediate medical attention if warning signs appear.</p>
              {data.govt_helpline && (
                <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="ew-icon-circle" style={{ background: 'rgba(79, 110, 247, 0.08)' }}>
                    📞
                  </div>
                  <div>
                    <p className="ew-eyebrow">Govt Helpline</p>
                    <p className="text-base font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{data.govt_helpline}</p>
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
