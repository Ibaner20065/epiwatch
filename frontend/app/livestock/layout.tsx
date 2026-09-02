"use client";

import { useState } from "react";
import Link from "next/link";
import { Lang, LANGUAGES, t } from "@/lib/livestock-i18n";

export default function LivestockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("en");

  const navItems = [
    { href: "/livestock", icon: "🏠", key: "nav_home" },
    { href: "/livestock/report", icon: "📋", key: "nav_report" },
    { href: "/livestock/map", icon: "🗺️", key: "nav_map" },
    { href: "/livestock/dashboard", icon: "📊", key: "nav_dashboard" },
    { href: "/livestock/animals", icon: "🐄", key: "nav_animals" },
    { href: "/livestock/lab", icon: "🔬", key: "nav_lab" },
    { href: "/livestock/alerts", icon: "🚨", key: "nav_alerts" },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary, #0a1628)" }}>
      {/* ── Sidebar ──────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 border-r sticky top-0 h-screen overflow-y-auto"
        style={{
          background: "rgba(15, 25, 40, 0.95)",
          borderColor: "rgba(212, 175, 55, 0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(212, 175, 55, 0.15)" }}>
          <Link href="/livestock" className="flex items-center gap-3 no-underline">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{
                background: "linear-gradient(135deg, #d4af37, #8b6914)",
                boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)",
              }}
            >
              🐄
            </div>
            <div>
              <h1
                className="text-base font-bold tracking-wider"
                style={{ color: "#d4af37", margin: 0 }}
              >
                {t(lang, "app_title")}
              </h1>
              <p
                className="text-[10px] tracking-wide"
                style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}
              >
                Maharashtra
              </p>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm no-underline transition-all duration-200"
              style={{
                color: "rgba(255,255,255,0.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(212, 175, 55, 0.1)";
                e.currentTarget.style.color = "#d4af37";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              }}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{t(lang, item.key)}</span>
            </Link>
          ))}
        </nav>

        {/* Language Selector */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(212, 175, 55, 0.15)" }}>
          <div className="flex gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: lang === l.code ? "rgba(212, 175, 55, 0.2)" : "transparent",
                  color: lang === l.code ? "#d4af37" : "rgba(255,255,255,0.5)",
                  border: `1px solid ${lang === l.code ? "rgba(212, 175, 55, 0.4)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Govt footer */}
        <div className="px-5 py-3 border-t" style={{ borderColor: "rgba(212, 175, 55, 0.1)" }}>
          <p className="text-[9px] leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>
            {t(lang, "govt_dept")}
          </p>
          <p className="text-[9px] mt-1" style={{ color: "rgba(212, 175, 55, 0.5)" }}>
            📞 1800-233-0418
          </p>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────── */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <header
          className="md:hidden sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b"
          style={{
            background: "rgba(15, 25, 40, 0.95)",
            borderColor: "rgba(212, 175, 55, 0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Link href="/livestock" className="flex items-center gap-2 no-underline">
            <span className="text-xl">🐄</span>
            <span className="font-bold tracking-wider" style={{ color: "#d4af37" }}>
              {t(lang, "app_title")}
            </span>
          </Link>
          <div className="flex gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="px-2 py-1 rounded text-[10px]"
                style={{
                  background: lang === l.code ? "rgba(212, 175, 55, 0.2)" : "transparent",
                  color: lang === l.code ? "#d4af37" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${lang === l.code ? "rgba(212, 175, 55, 0.3)" : "transparent"}`,
                }}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around px-2 py-2 border-t"
          style={{
            background: "rgba(15, 25, 40, 0.98)",
            borderColor: "rgba(212, 175, 55, 0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 text-[10px] no-underline"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{t(lang, item.key)}</span>
            </Link>
          ))}
        </nav>

        <div className="pb-20 md:pb-0">{children}</div>
      </main>
    </div>
  );
}
