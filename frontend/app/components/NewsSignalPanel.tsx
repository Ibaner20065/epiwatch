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
      return { bg: "rgba(234, 88, 12, 0.08)", color: "var(--risk-high)", label: "High Relevance" };
    case "medium":
      return { bg: "rgba(217, 119, 6, 0.08)", color: "var(--risk-moderate)", label: "Medium Relevance" };
    default:
      return { bg: "var(--surface-muted)", color: "var(--body-text)", label: "Low Relevance" };
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
    <div className="ew-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="ew-icon-circle">📡</div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
              Regional Signals — {districtName || districtId}
            </h3>
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--body-text)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-start)' }} />
              Informational only — not a model input
            </p>
          </div>
        </div>
        {data && (
          <span className="ew-eyebrow">
            {data.signal_count} signal{data.signal_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="skeleton w-48 h-3 rounded" />
        </div>
      ) : error || !data ? (
        <div className="h-[200px] flex flex-col items-center justify-center gap-2" style={{ color: 'var(--body-text)' }}>
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-medium">Could not load regional signals</p>
          <p className="text-xs text-center">Ensure the backend is running to fetch regional health advisories.</p>
        </div>
      ) : data.signals.length === 0 ? (
        <div className="h-[200px] flex flex-col items-center justify-center gap-2" style={{ color: 'var(--body-text)' }}>
          <span className="text-2xl">✅</span>
          <p className="text-sm font-medium">No recent regional signals</p>
          <p className="text-xs text-center max-w-xs">
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
                className="p-4 rounded-lg space-y-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getTypeIcon(signal.type)}</span>
                    <h4 className="text-sm font-medium leading-tight" style={{ color: 'var(--ink)' }}>{signal.title}</h4>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-[10px] font-medium rounded-full" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--body-text)' }}>{signal.summary}</p>

                <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--body-text)' }}>
                  <span>Source: {signal.source}</span>
                  {signal.districts_mentioned.length > 0 && (
                    <span style={{ color: 'var(--brand-start)' }}>
                      Districts: {signal.districts_mentioned.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 pt-3 flex items-center gap-2 text-[10px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--body-text)' }}>
        <span className="ew-icon-circle" style={{ width: 20, height: 20, fontSize: 10 }}>ℹ</span>
        <span>
          {data?.disclaimer || "Regional Signal — Informational only, not a model input. These are qualitative advisories, not quantitative predictions."}
        </span>
      </div>
    </div>
  );
}
