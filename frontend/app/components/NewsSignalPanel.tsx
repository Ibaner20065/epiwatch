"use client";

import React, { useState, useEffect } from "react";
import { fetchRegionalSignals, RegionalSignalResponse } from "@/lib/api-client";

interface NewsSignalPanelProps {
  districtId: string;
  districtName?: string;
}

function getRelevanceBadge(relevance: string) {
  switch (relevance) {
    case "high":
      return { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30", label: "High Relevance" };
    case "medium":
      return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", label: "Medium Relevance" };
    default:
      return { bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/30", label: "Low Relevance" };
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case "regional_context": return "🗺️";
    case "seasonal_advisory": return "🌧️";
    case "outbreak_alert": return "🚨";
    case "news_report": return "📰";
    default: return "📡";
  }
}

export default function NewsSignalPanel({ districtId, districtName }: NewsSignalPanelProps) {
  const [data, setData] = useState<RegionalSignalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchRegionalSignals(districtId)
      .then((res) => setData(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [districtId]);

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0d0d16]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex items-center justify-center text-base">
            📡
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Regional Signals — {districtName || districtId}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
              Informational only — not a model input
            </p>
          </div>
        </div>
        {data && (
          <span className="text-[10px] font-mono text-slate-500">
            {data.signal_count} signal{data.signal_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-[200px] flex items-center justify-center text-slate-500 text-xs">
          <span className="animate-pulse">Scanning regional signals...</span>
        </div>
      ) : error || !data ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
          <span className="text-2xl">⚠️</span>
          <p className="font-semibold">Could not load regional signals</p>
          <p className="text-slate-600 text-center">Ensure the backend is running to fetch regional health advisories.</p>
        </div>
      ) : data.signals.length === 0 ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
          <span className="text-2xl">✅</span>
          <p className="font-semibold">No recent regional signals</p>
          <p className="text-slate-600 text-center max-w-xs">
            No active public health advisories or outbreak reports detected for the {data.state} region at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {data.signals.map((signal, i) => {
            const badge = getRelevanceBadge(signal.relevance);
            return (
              <div
                key={i}
                className={`p-4 rounded-xl border ${badge.border} bg-slate-900/40 space-y-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getTypeIcon(signal.type)}</span>
                    <h4 className="text-xs font-bold text-slate-200 leading-tight">{signal.title}</h4>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{signal.summary}</p>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-600">
                  <span>Source: {signal.source}</span>
                  {signal.districts_mentioned.length > 0 && (
                    <span className="text-indigo-500">
                      Districts: {signal.districts_mentioned.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[9px] text-slate-600">
        <span className="w-3 h-3 rounded-full border border-amber-500/40 flex items-center justify-center text-[7px] text-amber-500">ℹ</span>
        <span>
          {data?.disclaimer || "Regional Signal — Informational only, not a model input. These are qualitative advisories, not quantitative predictions."}
        </span>
      </div>
    </div>
  );
}
