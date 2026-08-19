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
          border: "1px solid #FF3333",
          color: "#FF3333",
          label: "CRITICAL",
          serial: "TIER-04",
        };
      case "high":
        return {
          border: "1px solid rgba(255,255,255,0.7)",
          color: "rgba(255,255,255,0.9)",
          label: "HIGH",
          serial: "TIER-03",
        };
      case "medium":
        return {
          border: "1px solid #00FFFF",
          color: "#00FFFF",
          label: "MEDIUM",
          serial: "TIER-02",
        };
      default:
        return {
          border: "1px dashed rgba(255,255,255,0.3)",
          color: "rgba(255,255,255,0.5)",
          label: "LOW",
          serial: "TIER-01",
        };
    }
  };

  const style = getBadgeStyle();
  const px =
    size === "sm"
      ? "px-2 py-0.5 text-[9px]"
      : size === "lg"
      ? "px-4 py-1.5 text-xs"
      : "px-3 py-1 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-widest font-mono ${px}`}
      style={{
        background: "transparent",
        border: style.border,
        color: style.color,
        borderStyle: tier?.toLowerCase() === "low" ? "dashed" : "solid",
      }}
    >
      <span
        className="text-[7px] opacity-60"
        style={{ color: style.color }}
      >
        [{style.serial}]
      </span>
      {style.label}
    </span>
  );
}
