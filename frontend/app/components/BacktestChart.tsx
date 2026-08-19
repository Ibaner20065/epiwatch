"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface BacktestChartProps {
  weeks: string[];
  actual: number[];
  predicted: number[];
}

export default function BacktestChart({ weeks, actual, predicted }: BacktestChartProps) {
  const chartData = weeks.map((w, idx) => ({
    date: new Date(w).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Actual: actual[idx],
    Predicted: predicted[idx],
  }));

  return (
    <div className="w-full h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
          />
          <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "11px", fontFamily: "'Roboto Mono', monospace" }} />
          <Line
            type="monotone"
            dataKey="Actual"
            stroke="#FF3333"
            strokeWidth={2}
            dot={{ r: 3, fill: "#FF3333" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Predicted"
            stroke="#00FFFF"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "#00FFFF" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
