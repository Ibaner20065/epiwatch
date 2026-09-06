"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ForecastPoint } from "@/lib/api-client";

interface ForecastChartProps {
  data: ForecastPoint[];
}

export default function ForecastChart({ data }: ForecastChartProps) {
  const formattedData = data.map((d) => ({
    date: new Date(d.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    predicted: d.predicted_cases,
    ci_lower: d.ci_lower,
    ci_upper: d.ci_upper,
    ci_band: [d.ci_lower, d.ci_upper],
  }));

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradObserved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--observed-data)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--observed-data)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--predicted-data)" stopOpacity={0.12} />
              <stop offset="95%" stopColor="var(--predicted-data)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--border)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--border)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--body-text)", fontFamily: "var(--font-mono)" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--body-text)", fontFamily: "var(--font-mono)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--ink)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              boxShadow: "var(--shadow-card)",
            }}
            formatter={(val: any, name: any) => [
              val ? Math.round(Number(val)).toLocaleString() + " cases" : "0 cases",
              name === "predicted" ? "Predicted Cases" : String(name),
            ]}
          />
          {/* Confidence interval band */}
          <Area
            type="monotone"
            dataKey="ci_upper"
            stroke="none"
            fill="url(#gradCI)"
          />
          {/* Predicted line — uses dashed stroke per PRD §7 */}
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="var(--predicted-data)"
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="url(#gradPredicted)"
            dot={{ r: 3, fill: "var(--predicted-data)", strokeWidth: 1, stroke: "var(--surface)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
