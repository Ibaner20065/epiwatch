"use client";

import { useEffect, useRef } from "react";

export default function BlueprintCursor() {
  const trackerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tracker = trackerRef.current;
    if (!tracker) return;

    const handleMouseMove = (e: MouseEvent) => {
      tracker.style.left = `${e.clientX + 14}px`;
      tracker.style.top = `${e.clientY + 14}px`;
      tracker.textContent = `x:${e.clientX} y:${e.clientY}`;
    };

    const handleMouseEnter = () => {
      tracker.style.opacity = "0.7";
    };

    const handleMouseLeave = () => {
      tracker.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <div ref={trackerRef} id="bp-cursor-tracker" />;
}
