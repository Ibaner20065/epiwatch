"use client";

import Link from "next/link";
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
    <div className="flex h-[450px] w-full flex-col ew-card p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            Predicted Outbreak Curve vs Actual Recorded Outcome
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            Values normalized against peak observed or predicted intensity (Guardrail 2: Solid Observed vs Dashed Predicted)
          </p>
        </div>
        {/* FR-9 Visible Link to Methodology */}
        <Link
          href="/methodology"
          className="ew-btn-compact text-xs no-underline font-medium"
          style={{ height: 28, borderRadius: "var(--radius-sm)" }}
        >
          Methodology (FR-9) →
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 14, right: 12, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="2 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
              tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
              label={{
                value: "Normalized Outbreak Intensity",
                angle: -90,
                position: "insideLeft",
                offset: 8,
                style: { fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono)" },
              }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--fg)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                boxShadow: "var(--shadow-card)",
              }}
              formatter={(value: unknown, name: unknown) => [
                (typeof value === "number" ? value : Number(value ?? 0)).toFixed(2),
                name === "Actual (Observed)" ? "Actual (Observed)" : "Predicted",
              ]}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "12px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--muted)",
              }}
            />
            {/* Observed = solid line per Guardrail 2 */}
            <Line
              type="monotone"
              name="Actual (Observed)"
              dataKey="actual"
              stroke="var(--observed-data)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--observed-data)", stroke: "var(--observed-data)" }}
              activeDot={{ r: 5, fill: "var(--observed-data)" }}
            />
            {/* Predicted = dashed line per Guardrail 2 */}
            <Line
              type="monotone"
              name="Predicted"
              dataKey="predicted"
              stroke="var(--predicted-data)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: "var(--predicted-data)", stroke: "var(--predicted-data)" }}
              activeDot={{ r: 5, fill: "var(--predicted-data)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
