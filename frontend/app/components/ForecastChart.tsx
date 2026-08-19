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
            <linearGradient id="gradPred" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(255,255,255,0.15)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="rgba(255,255,255,0.02)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)", fontFamily: "'Roboto Mono', monospace" }} />
          <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)", fontFamily: "'Roboto Mono', monospace" }} />
          <Tooltip
            contentStyle={{
              background: "#002244",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "0px",
              color: "rgba(255,255,255,0.85)",
              fontSize: "11px",
              fontFamily: "'Roboto Mono', monospace",
            }}
            formatter={(val: any, name: any) => [
              val ? Math.round(Number(val)).toLocaleString() + " cases" : "0 cases",
              name === "predicted" ? "Predicted Cases" : String(name),
            ]}
          />
          <Area
            type="monotone"
            dataKey="ci_upper"
            stroke="none"
            fill="url(#gradCI)"
          />
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#00FFFF"
            strokeWidth={2}
            fill="url(#gradPred)"
            dot={{ r: 3, fill: "#00FFFF", strokeWidth: 1, stroke: "#ffffff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
