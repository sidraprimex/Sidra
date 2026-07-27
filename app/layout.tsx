import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RoleClaimRefreshBridge } from "@/components/auth/RoleClaimRefreshBridge";
import { SiteFrame } from "@/components/layout/SiteFrame";

export const metadata: Metadata = {
  title: { default: "Sidra", template: "%s · Sidra" },
  description: "A curated luxury digital ecosystem for resin art and handcrafted goods.",
  applicationName: "Sidra",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B1E35",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RoleClaimRefreshBridge />
          <SiteFrame>{children}</SiteFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
