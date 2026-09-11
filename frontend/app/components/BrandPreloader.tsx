"use client";

import { createElement, useEffect, useState } from "react";
import Image from "next/image";

export default function BrandPreloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 1400);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="ew-preloader" role="status" aria-label="Loading EpiWatch">
      <div className="ew-preloader__content">
        <Image
          className="ew-preloader__logo"
          src="/epiwatch-logo.png"
          alt="EpiWatch"
          width={92}
          height={92}
          priority
        />
        {createElement("dotlottie-player", {
          src: "/heartbeat.lottie",
          autoplay: true,
          loop: true,
          style: { width: 180, height: 180 },
        })}
      </div>
    </div>
  );
}
