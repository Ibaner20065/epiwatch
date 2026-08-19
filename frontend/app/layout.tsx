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
  title: "EpiWatch — Global Disease Intelligence",
  description:
    "Real-time disease surveillance dashboard with live global outbreak data, demographic insights, and predictive analytics for epidemic preparedness.",
  keywords: ["disease surveillance", "epidemic", "outbreak", "health data", "demographics"],
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
