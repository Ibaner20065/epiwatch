"use client";

import { useState } from "react";
import Link from "next/link";
import { Lang, LANGUAGES, t } from "@/lib/livestock-i18n";
import MorphIcon from "@/app/components/MorphIcon";

export default function LivestockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex min-h-dvh" style={{ background: "var(--surface-muted)" }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-64 sticky top-0 h-screen overflow-y-auto"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          boxShadow: "1px 0 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/livestock" className="flex items-center gap-3 no-underline">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{
                background: "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 2px 8px rgba(79, 110, 247, 0.2)",
              }}
            >
              🐄
            </div>
            <div>
              <h1
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--fg)", margin: 0 }}
              >
                {t(lang, "app_title")}
              </h1>
              <p
                className="text-[10px] font-medium"
                style={{ color: "var(--muted)", margin: 0 }}
              >
                356 Maharashtra Tehsils
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold no-underline transition-all"
              style={{
                color: "var(--fg-2)",
                borderRadius: "var(--radius-md)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-muted)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--fg-2)";
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{t(lang, item.key)}</span>
            </Link>
          ))}
        </nav>

        {/* Back to Rural Health */}
        <div className="px-3 py-2" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs no-underline font-medium"
            style={{ color: "var(--muted)", borderRadius: "var(--radius-md)" }}
          >
            ← Back to Rural One-Health
          </Link>
        </div>

        {/* Language Selector */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: lang === l.code ? "rgba(79, 110, 247, 0.08)" : "transparent",
                  color: lang === l.code ? "var(--accent)" : "var(--muted)",
                  boxShadow: lang === l.code ? "0 0 0 1px var(--accent)" : "none",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Govt footer */}
        <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[10px] leading-tight font-medium" style={{ color: "var(--muted)" }}>
            {t(lang, "govt_dept")}
          </p>
          <p className="text-[10px] mt-1 font-mono font-semibold" style={{ color: "var(--accent)" }}>
            📞 1800-233-0418 (24x7 IVR)
          </p>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Mobile header with FR-11 MorphIcon Menu ↔ Close */}
        <header
          className="md:hidden sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center gap-2">
            {/* FR-11 Mobile Nav MorphIcon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ew-btn-compact"
              style={{ width: 36, height: 36, padding: 0, borderRadius: "var(--radius-sm)" }}
              aria-label="Toggle Mobile Navigation"
            >
              <MorphIcon
                state={mobileMenuOpen ? "close" : "menu"}
                size={18}
                color="var(--fg)"
              />
            </button>
            <Link href="/livestock" className="flex items-center gap-2 no-underline">
              <span className="text-xl">🐄</span>
              <span className="font-bold text-sm" style={{ color: "var(--fg)" }}>
                {t(lang, "app_title")}
              </span>
            </Link>
          </div>

          <div className="flex gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="px-2 py-1 rounded text-[10px] font-semibold"
                style={{
                  background: lang === l.code ? "rgba(79, 110, 247, 0.08)" : "transparent",
                  color: lang === l.code ? "var(--accent)" : "var(--muted)",
                }}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* Mobile Dropdown Drawer (t-menu-dropdown) */}
        {mobileMenuOpen && (
          <div
            className="t-menu-dropdown md:hidden px-4 py-3 space-y-1"
            style={{
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium no-underline"
                style={{ color: "var(--fg-2)" }}
              >
                <span>{item.icon}</span>
                <span>{t(lang, item.key)}</span>
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-xs text-blue-600 no-underline"
              >
                ← Back to Rural One-Health
              </Link>
            </div>
          </div>
        )}

        <div className="flex-1 pb-16 md:pb-0">{children}</div>
      </main>
    </div>
  );
}
