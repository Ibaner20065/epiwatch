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
          />
          <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
          <Line
            type="monotone"
            dataKey="Actual"
            stroke="#f43f5e"
            strokeWidth={3}
            dot={{ r: 4, fill: "#f43f5e" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Predicted"
            stroke="#10b981"
            strokeWidth={3}
            strokeDasharray="4 4"
            dot={{ r: 4, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
