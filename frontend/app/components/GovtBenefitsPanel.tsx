"use client";

import { useEffect, useState } from "react";
import { fetchGovtBenefits, GovtScheme } from "@/lib/api-client";

interface GovtBenefitsPanelProps {
  diseaseId: string;
  projectedCases: number;
}

export default function GovtBenefitsPanel({ diseaseId, projectedCases }: GovtBenefitsPanelProps) {
  const [benefits, setBenefits] = useState<GovtScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const res = await fetchGovtBenefits(diseaseId);
      if (active) {
        setBenefits(res);
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [diseaseId]);

  // Rough estimation logic based on disease (mock costs)
  const averageCostPerCase = diseaseId.toLowerCase() === "dengue" ? 25000 : diseaseId.toLowerCase() === "malaria" ? 15000 : 35000;
  const totalEconomicImpact = projectedCases * averageCostPerCase;

  if (loading) {
    return (
      <div className="blueprint-card p-6 flex items-center justify-center h-[200px]">
        <div className="text-[10px] font-mono" style={{ color: 'var(--bp-white-faint)', animation: 'bp-pulse 2s ease-in-out infinite' }}>Loading benefits data...</div>
      </div>
    );
  }

  return (
    <div className="blueprint-card p-6">
      <div className="bp-corners">
        <span className="corner-tr">+</span>
        <span className="corner-bl">+</span>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
            <span className="bp-serial">[SEC-05]</span> Government Benefits &amp; Cost Impact
          </h3>
          <p className="text-[10px] mt-1" style={{ color: 'var(--bp-white-faint)' }}>
            Economic projection based on expected case volume for {diseaseId.toUpperCase()}.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cost Impact Widget */}
        <div className="lg:col-span-1 p-5 border border-[var(--bp-line-faint)]">
          <h4 className="bp-serial mb-4">ECONOMIC PROJECTION</h4>
          <div className="space-y-4">
            <div>
              <p className="bp-serial mb-1">PROJECTED CASES (8-WEEK)</p>
              <p className="text-xl font-mono" style={{ color: 'var(--bp-white)' }}>{Math.round(projectedCases).toLocaleString()}</p>
            </div>
            <div>
              <p className="bp-serial mb-1">AVG OUT-OF-POCKET COST / CASE</p>
              <p className="text-lg font-mono" style={{ color: 'var(--bp-redline)' }}>₹{averageCostPerCase.toLocaleString()}</p>
            </div>
            <div className="pt-4 border-t border-[var(--bp-line-faint)]">
              <p className="bp-serial mb-1">ESTIMATED TOTAL IMPACT</p>
              <p className="text-2xl font-mono font-bold" style={{ color: 'var(--bp-redline)' }}>₹{(totalEconomicImpact / 100000).toFixed(1)} Lakhs</p>
            </div>
          </div>
        </div>

        {/* Available Schemes List */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="bp-serial mb-2">AVAILABLE SUPPORT SCHEMES</h4>
          
          {benefits.length > 0 ? (
            <div className="space-y-3">
              {benefits.map((scheme, i) => (
                <div key={i} className="p-4 border border-[var(--bp-cyan-dim)] hover:bg-[rgba(0,255,255,0.03)] transition flex flex-col md:flex-row gap-4 justify-between items-start md:items-center" style={{ borderStyle: 'dashed' }}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-bold text-xs" style={{ color: 'var(--bp-cyan)' }}>{scheme.scheme_name}</h5>
                      <span className="px-2 py-0.5 text-[8px] uppercase font-bold tracking-widest border border-[var(--bp-line-faint)]" style={{ color: 'var(--bp-white-faint)' }}>
                        {scheme.covering_body}
                      </span>
                    </div>
                    {scheme.eligibility_summary && (
                      <p className="text-[10px] max-w-lg leading-relaxed" style={{ color: 'var(--bp-white-faint)' }}>{scheme.eligibility_summary}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    {scheme.max_coverage_amount && (
                      <div>
                        <p className="bp-serial mb-0.5">COVERAGE UP TO</p>
                        <p className="text-xs font-mono font-bold" style={{ color: 'var(--bp-cyan)' }}>{scheme.max_coverage_amount}</p>
                      </div>
                    )}
                    {scheme.application_link && (
                      <a href={scheme.application_link} target="_blank" rel="noreferrer" className="w-8 h-8 border border-[var(--bp-line-faint)] hover:border-[var(--bp-cyan)] transition flex items-center justify-center text-xs" style={{ color: 'var(--bp-white-soft)' }}>
                        →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="p-6 border border-[var(--bp-line-faint)] flex flex-col items-center justify-center h-[180px] gap-2">
                <span className="text-2xl">🏛️</span>
                <p className="text-xs font-bold" style={{ color: 'var(--bp-white-muted)' }}>No schemes listed for {diseaseId.toUpperCase()}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
