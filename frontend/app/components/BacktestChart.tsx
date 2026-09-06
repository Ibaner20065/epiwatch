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
  const peak = Math.max(...actual, ...predicted, 0);
  const chartData = weeks.map((w, idx) => ({
    date: new Date(w).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    actual: peak ? (actual[idx] ?? 0) / peak : 0,
    predicted: peak ? (predicted[idx] ?? 0) / peak : 0,
  }));

  return (
    <div className="flex h-[430px] w-full flex-col bg-white p-4 sm:p-5">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 sm:text-sm">
            Predicted Outbreak Curve vs Actual Recorded Outcome
          </h3>
          <p className="mt-1 text-[9px] text-slate-500 sm:text-[10px]">
            Values are normalized against the peak observed or predicted intensity
          </p>
        </div>
        <span className="hidden text-[9px] uppercase tracking-wide text-slate-400 sm:block">
          Backtest signal
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 14, right: 12, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#334155", fontFamily: "monospace" }}
            axisLine={{ stroke: "#64748b" }}
            tickLine={{ stroke: "#94a3b8" }}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            tick={{ fontSize: 9, fill: "#334155", fontFamily: "monospace" }}
            axisLine={{ stroke: "#64748b" }}
            tickLine={{ stroke: "#94a3b8" }}
            label={{
              value: "Normalized Outbreak Intensity",
              angle: -90,
              position: "insideLeft",
              offset: 8,
              style: { fill: "#334155", fontSize: 9, fontFamily: "monospace" },
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "2px",
              color: "#0f172a",
              fontSize: "10px",
              fontFamily: "monospace",
            }}
            formatter={(value: unknown, name: unknown) => [
              (typeof value === "number" ? value : Number(value ?? 0)).toFixed(2),
              name === "Actual" ? "Actual" : "Predicted",
            ]}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "12px",
              fontSize: "10px",
              fontFamily: "monospace",
              color: "#334155",
            }}
          />
          <Line
            type="monotone"
            name="Actual"
            dataKey="actual"
            stroke="#ef2b2d"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ef2b2d", stroke: "#ef2b2d" }}
            activeDot={{ r: 5, fill: "#ef2b2d" }}
          />
          <Line
            type="monotone"
            name="Predicted"
            dataKey="predicted"
            stroke="#16a34a"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "#16a34a", stroke: "#16a34a" }}
            activeDot={{ r: 5, fill: "#16a34a" }}
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
