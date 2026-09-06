import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EpiWatch GramRaksha — Rural One-Health Disease & Livestock Outbreak Intelligence",
  description:
    "AI-powered rural epidemiological intelligence platform bridging village health surveillance, 356-tehsil livestock economics, and climate-driven outbreak forecasting.",
  keywords: ["rural health", "livestock surveillance", "one health", "pashuraksha", "tehsil census", "epidemic prediction"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-dvh flex flex-col" style={{ fontFamily: 'var(--font-sans)' }}>
        {children}
      </body>
    </html>
  );
}
