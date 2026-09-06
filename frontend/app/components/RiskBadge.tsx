import React from "react";

interface RiskBadgeProps {
  tier: "Low" | "Medium" | "High" | "Critical" | string;
  size?: "sm" | "md" | "lg";
}

/**
 * Status/Risk Tag Component (permitted pill geometry exception per §1.6).
 * Strictly bound to semantic risk tokens:
 * - Low → --success (#16a34a)
 * - Moderate → --warn (#eab308)
 * - High / Critical → --danger (#dc2626)
 * Features t-text-states-swap for in-place tier transitions.
 */
export default function RiskBadge({ tier, size = "md" }: RiskBadgeProps) {
  const tierKey = tier?.toLowerCase() || "low";

  const badgeClass = `ew-badge ew-badge--${tierKey === "medium" ? "moderate" : tierKey}`;

  const label =
    tierKey === "critical" ? "Critical" :
    tierKey === "high" ? "High" :
    tierKey === "medium" ? "Moderate" :
    "Low";

  const px =
    size === "sm"
      ? "px-2.5 py-0.5 text-[10px]"
      : size === "lg"
      ? "px-4 py-1.5 text-xs"
      : "px-3 py-1 text-[11px]";

  return (
    <span className={`${badgeClass} ${px}`} role="status">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background:
            tierKey === "critical" || tierKey === "high"
              ? "var(--danger)"
              : tierKey === "medium" || tierKey === "moderate"
              ? "var(--warn)"
              : "var(--success)",
        }}
      />
      <span key={label} className="t-text-states-swap font-semibold">
        {label}
      </span>
    </span>
  );
}
