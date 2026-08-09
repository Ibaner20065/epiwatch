import React from "react";

interface RiskBadgeProps {
  tier: "Low" | "Medium" | "High" | "Critical" | string;
  size?: "sm" | "md" | "lg";
}

export default function RiskBadge({ tier, size = "md" }: RiskBadgeProps) {
  const getBadgeStyle = () => {
    switch (tier?.toLowerCase()) {
      case "critical":
        return {
          bg: "rgba(244, 63, 94, 0.15)",
          border: "1px solid rgba(244, 63, 94, 0.4)",
          color: "#f43f5e",
          label: "CRITICAL RISK",
        };
      case "high":
        return {
          bg: "rgba(251, 146, 60, 0.15)",
          border: "1px solid rgba(251, 146, 60, 0.4)",
          color: "#fb923c",
          label: "HIGH RISK",
        };
      case "medium":
        return {
          bg: "rgba(251, 191, 36, 0.15)",
          border: "1px solid rgba(251, 191, 36, 0.4)",
          color: "#fbbf24",
          label: "MEDIUM RISK",
        };
      default:
        return {
          bg: "rgba(52, 211, 153, 0.15)",
          border: "1px solid rgba(52, 211, 153, 0.4)",
          color: "#34d399",
          label: "LOW RISK",
        };
    }
  };

  const style = getBadgeStyle();
  const px = size === "sm" ? "px-2 py-0.5 text-[10px]" : size === "lg" ? "px-4 py-1.5 text-sm" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full ${px}`}
      style={{
        background: style.bg,
        border: style.border,
        color: style.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: style.color }}
      />
      {style.label}
    </span>
  );
}
