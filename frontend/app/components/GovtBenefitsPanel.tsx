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
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16] flex items-center justify-center h-[200px]">
        <div className="text-slate-500 animate-pulse text-sm">Loading benefits data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            5. Government Benefits & Cost Impact
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Economic projection based on expected case volume for {diseaseId.toUpperCase()}.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cost Impact Widget */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Economic Projection</h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Projected Cases (8-Week)</p>
              <p className="text-xl font-mono text-white">{Math.round(projectedCases).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Avg Out-of-Pocket Cost / Case</p>
              <p className="text-lg font-mono text-rose-400">₹{averageCostPerCase.toLocaleString()}</p>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Estimated Total Impact</p>
              <p className="text-2xl font-mono font-bold text-rose-500">₹{(totalEconomicImpact / 100000).toFixed(1)} Lakhs</p>
            </div>
          </div>
        </div>

        {/* Available Schemes List */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Available Support Schemes</h4>
          
          {benefits.length > 0 ? (
            <div className="space-y-3">
              {benefits.map((scheme, i) => (
                <div key={i} className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-indigo-300 text-sm">{scheme.scheme_name}</h5>
                      <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                        {scheme.covering_body}
                      </span>
                    </div>
                    {scheme.eligibility_summary && (
                      <p className="text-xs text-slate-400 max-w-lg leading-relaxed">{scheme.eligibility_summary}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    {scheme.max_coverage_amount && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Coverage up to</p>
                        <p className="text-sm font-mono text-emerald-400 font-semibold">{scheme.max_coverage_amount}</p>
                      </div>
                    )}
                    {scheme.application_link && (
                      <a href={scheme.application_link} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 transition flex items-center justify-center text-white text-xs shrink-0">
                        →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center h-[180px] text-slate-500 gap-2">
                <span className="text-2xl">🏛️</span>
                <p className="text-sm font-semibold">No schemes listed for {diseaseId.toUpperCase()}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
