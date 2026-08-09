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
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px",
              color: "#f8fafc",
              fontSize: "12px",
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
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#gradPred)"
            dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#ffffff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
