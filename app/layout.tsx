import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { OpeningCinematic } from "@/components/motion/OpeningCinematic";

export const metadata: Metadata = {
  title: { default: "Sidra", template: "%s · Sidra" },
  description: "A curated luxury digital ecosystem for resin art and handcrafted goods.",
  applicationName: "Sidra",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0B0B",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OpeningCinematic />
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
