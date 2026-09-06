"use client";

import React, { useMemo } from "react";

export type MorphIconType =
  | "spinner"
  | "check"
  | "bell"
  | "search"
  | "searching"
  | "answered"
  | "menu"
  | "close";

interface MorphIconProps {
  state: MorphIconType;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

/**
 * Morphicons-compliant SVG shape-morphing component.
 * Animates path geometry and stroke dynamics between same-control states:
 * - spinner ↔ check (field report submission)
 * - bell ↔ check (alert acknowledge)
 * - search ↔ answered (assistant query grounding)
 * - menu ↔ close (mobile nav toggle)
 *
 * Implements automatic rotation, interruptible transition timing,
 * and respects prefers-reduced-motion guards.
 */
export default function MorphIcon({
  state,
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
}: MorphIconProps) {
  // Geometry and rotation angles calculated from control semantics
  const { rotation, paths, viewBox } = useMemo(() => {
    switch (state) {
      case "spinner":
        return {
          rotation: 0,
          viewBox: "0 0 24 24",
          paths: [
            {
              d: "M12 2a10 10 0 0 1 10 10",
              className: "morph-spinner-spin",
              dashArray: "16 32",
              dashOffset: 0,
            },
            {
              d: "M12 22a10 10 0 0 1-10-10",
              className: "morph-spinner-spin",
              dashArray: "16 32",
              dashOffset: 16,
            },
          ],
        };
      case "check":
        return {
          rotation: 0,
          viewBox: "0 0 24 24",
          paths: [
            {
              d: "M4 12.5l5.5 5.5L20 7",
              className: "morph-stroke-draw",
              dashArray: "28",
              dashOffset: 0,
            },
          ],
        };
      case "bell":
        return {
          rotation: 0,
          viewBox: "0 0 24 24",
          paths: [
            {
              d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
              className: "",
              dashArray: "none",
              dashOffset: 0,
            },
            {
              d: "M13.73 21a2 2 0 0 1-3.46 0",
              className: "",
              dashArray: "none",
              dashOffset: 0,
            },
          ],
        };
      case "search":
      case "searching":
        return {
          rotation: 0,
          viewBox: "0 0 24 24",
          paths: [
            {
              d: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
              className: "",
              dashArray: "none",
              dashOffset: 0,
            },
            {
              d: "m21 21-4.35-4.35",
              className: "",
              dashArray: "none",
              dashOffset: 0,
            },
          ],
        };
      case "answered":
        return {
          rotation: 360,
          viewBox: "0 0 24 24",
          paths: [
            {
              d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
              className: "morph-stroke-draw",
              dashArray: "none",
              dashOffset: 0,
            },
            {
              d: "m9 12 2 2 4-4",
              className: "morph-stroke-draw",
              dashArray: "12",
              dashOffset: 0,
            },
          ],
        };
      case "menu":
        return {
          rotation: 0,
          viewBox: "0 0 24 24",
          paths: [
            {
              d: "M4 6h16",
              className: "",
              dashArray: "none",
              dashOffset: 0,
            },
            {
              d: "M4 12h16",
              className: "",
              dashArray: "none",
              dashOffset: 0,
            },
            {
              d: "M4 18h16",
              className: "",
              dashArray: "none",
              dashOffset: 0,
            },
          ],
        };
      case "close":
        return {
          rotation: 90,
          viewBox: "0 0 24 24",
          paths: [
            {
              d: "M18 6L6 18",
              className: "morph-stroke-draw",
              dashArray: "none",
              dashOffset: 0,
            },
            {
              d: "M6 6l12 12",
              className: "morph-stroke-draw",
              dashArray: "none",
              dashOffset: 0,
            },
          ],
        };
      default:
        return {
          rotation: 0,
          viewBox: "0 0 24 24",
          paths: [],
        };
    }
  }, [state]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`morph-icon ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: "transform 350ms cubic-bezier(0.34, 1.36, 0.64, 1)",
      }}
    >
      <style>{`
        @keyframes morphSpinKeyframe {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes morphDrawKeyframe {
          from { stroke-dashoffset: 28; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        .morph-spinner-spin {
          animation: morphSpinKeyframe 800ms linear infinite;
          transform-origin: 12px 12px;
        }
        .morph-stroke-draw {
          animation: morphDrawKeyframe 350ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .morph-spinner-spin { animation: none !important; }
          .morph-stroke-draw { animation: none !important; }
          .morph-icon { transition: none !important; }
        }
      `}</style>
      {paths.map((p, idx) => (
        <path
          key={`${state}-${idx}`}
          d={p.d}
          className={p.className}
          style={{
            strokeDasharray: p.dashArray,
            strokeDashoffset: p.dashOffset,
            transition: "all 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      ))}
    </svg>
  );
}
