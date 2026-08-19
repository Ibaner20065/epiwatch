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
      return { border: "var(--bp-redline)", color: "var(--bp-redline)", label: "HIGH RELEVANCE" };
    case "medium":
      return { border: "var(--bp-cyan)", color: "var(--bp-cyan)", label: "MEDIUM RELEVANCE" };
    default:
      return { border: "var(--bp-white-faint)", color: "var(--bp-white-faint)", label: "LOW RELEVANCE" };
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
    <div className="blueprint-card p-6">
      <div className="bp-corners">
        <span className="corner-tr">+</span>
        <span className="corner-bl">+</span>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 border border-[var(--bp-cyan-dim)] flex items-center justify-center text-base">
            📡
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
              <span className="bp-serial">[SIG-01]</span> Regional Signals — {districtName || districtId}
            </h3>
            <p className="text-[9px] font-mono flex items-center gap-1" style={{ color: 'var(--bp-white-faint)' }}>
              <span className="w-1.5 h-1.5" style={{ background: 'var(--bp-cyan-dim)' }} />
              Informational only — not a model input
            </p>
          </div>
        </div>
        {data && (
          <span className="bp-coord">
            {data.signal_count} signal{data.signal_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-[200px] flex items-center justify-center text-[10px]" style={{ color: 'var(--bp-white-faint)' }}>
          <span style={{ animation: 'bp-pulse 2s ease-in-out infinite' }}>Scanning regional signals...</span>
        </div>
      ) : error || !data ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-[10px] gap-2" style={{ color: 'var(--bp-white-faint)' }}>
          <span className="text-2xl">⚠️</span>
          <p className="font-bold">Could not load regional signals</p>
          <p className="text-center">Ensure the backend is running to fetch regional health advisories.</p>
        </div>
      ) : data.signals.length === 0 ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-[10px] gap-2" style={{ color: 'var(--bp-white-faint)' }}>
          <span className="text-2xl">✅</span>
          <p className="font-bold">No recent regional signals</p>
          <p className="text-center max-w-xs">
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
                className="p-4 border space-y-2"
                style={{ borderColor: badge.border }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getTypeIcon(signal.type)}</span>
                    <h4 className="text-[10px] font-bold leading-tight" style={{ color: 'var(--bp-white-soft)' }}>{signal.title}</h4>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border" style={{ borderColor: badge.border, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--bp-white-faint)' }}>{signal.summary}</p>

                <div className="flex items-center justify-between text-[8px] font-mono" style={{ color: 'var(--bp-white-faint)' }}>
                  <span>Source: {signal.source}</span>
                  {signal.districts_mentioned.length > 0 && (
                    <span style={{ color: 'var(--bp-cyan-dim)' }}>
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
      <div className="mt-4 pt-3 border-t border-[var(--bp-line-faint)] flex items-center gap-2 text-[8px]" style={{ color: 'var(--bp-white-faint)' }}>
        <span className="w-3 h-3 border flex items-center justify-center text-[6px]" style={{ borderColor: 'var(--bp-cyan-dim)', color: 'var(--bp-cyan-dim)' }}>ℹ</span>
        <span>
          {data?.disclaimer || "Regional Signal — Informational only, not a model input. These are qualitative advisories, not quantitative predictions."}
        </span>
      </div>
    </div>
  );
}
