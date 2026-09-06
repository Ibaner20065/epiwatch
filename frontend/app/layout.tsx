import type { Metadata } from "next";
import { Architects_Daughter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import BlueprintCursor from "@/app/components/BlueprintCursor";

const architectsDaughter = Architects_Daughter({
  variable: "--font-architects",
  subsets: ["latin"],
  weight: "400",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
      className={`${architectsDaughter.variable} ${robotoMono.variable} h-full`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <BlueprintCursor />
      </body>
    </html>
  );
}
