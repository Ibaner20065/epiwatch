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

  const averageCostPerCase = diseaseId.toLowerCase() === "dengue" ? 25000 : diseaseId.toLowerCase() === "malaria" ? 15000 : 35000;
  const totalEconomicImpact = projectedCases * averageCostPerCase;

  if (loading) {
    return (
      <div className="ew-card p-6 flex items-center justify-center h-[200px]">
        <div className="skeleton w-48 h-3 rounded" />
      </div>
    );
  }

  return (
    <div className="ew-card p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <span className="ew-eyebrow">Government Benefits & Cost Impact</span>
          <h3 className="text-base font-semibold mt-1" style={{ color: 'var(--ink)' }}>
            Economic projection for {diseaseId.charAt(0).toUpperCase() + diseaseId.slice(1)}
          </h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cost Impact Widget */}
        <div className="lg:col-span-1 p-5 rounded-lg" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="ew-eyebrow mb-4">Economic Projection</p>
          <div className="space-y-4">
            <div>
              <p className="ew-eyebrow mb-1" style={{ fontSize: 10 }}>Projected Cases (8-Week)</p>
              <p className="ew-data-lg" style={{ fontSize: 24, color: 'var(--ink)' }}>{Math.round(projectedCases).toLocaleString()}</p>
            </div>
            <div>
              <p className="ew-eyebrow mb-1" style={{ fontSize: 10 }}>Avg Out-of-Pocket Cost / Case</p>
              <p className="ew-data-lg" style={{ fontSize: 20, color: 'var(--risk-high)' }}>₹{averageCostPerCase.toLocaleString()}</p>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="ew-eyebrow mb-1" style={{ fontSize: 10 }}>Estimated Total Impact</p>
              <p className="ew-data-lg" style={{ fontSize: 28, color: 'var(--risk-critical)' }}>₹{(totalEconomicImpact / 100000).toFixed(1)} Lakhs</p>
            </div>
          </div>
        </div>

        {/* Available Schemes List */}
        <div className="lg:col-span-2 space-y-4">
          <p className="ew-eyebrow mb-2">Available Support Schemes</p>
          
          {benefits.length > 0 ? (
            <div className="space-y-3">
              {benefits.map((scheme, i) => (
                <div key={i} className="p-4 rounded-lg flex flex-col md:flex-row gap-4 justify-between items-start md:items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-sm" style={{ color: 'var(--brand-start)' }}>{scheme.scheme_name}</h5>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ background: 'var(--surface-muted)', color: 'var(--body-text)' }}>
                        {scheme.covering_body}
                      </span>
                    </div>
                    {scheme.eligibility_summary && (
                      <p className="text-xs max-w-lg leading-relaxed" style={{ color: 'var(--body-text)' }}>{scheme.eligibility_summary}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    {scheme.max_coverage_amount && (
                      <div>
                        <p className="ew-eyebrow mb-0.5" style={{ fontSize: 9 }}>Coverage Up To</p>
                        <p className="ew-data-sm font-semibold" style={{ color: 'var(--brand-start)' }}>{scheme.max_coverage_amount}</p>
                      </div>
                    )}
                    {scheme.application_link && (
                      <a href={scheme.application_link} target="_blank" rel="noreferrer" className="ew-btn-compact text-xs no-underline" style={{ borderRadius: "var(--radius-sm)" }}>
                        Apply →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="p-6 rounded-lg flex flex-col items-center justify-center h-[180px] gap-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                <span className="text-2xl">🏛️</span>
                <p className="text-sm font-medium" style={{ color: 'var(--body-text)' }}>No schemes listed for {diseaseId.toUpperCase()}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
