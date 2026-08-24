import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PageMotion } from "@/components/page-motion";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSessionProfile } from "@/lib/auth";
import { getActiveThemeId } from "@/lib/theme";
import {
  defaultOpenGraph,
  defaultTwitter,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site-metadata";
import { CANONICAL_SITE_URL } from "@/lib/site-url";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_SITE_URL),
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  openGraph: defaultOpenGraph,
  twitter: defaultTwitter,
  icons: {
    icon: "/branding/Nails%20by%20Gabs.png",
    shortcut: "/branding/Nails%20by%20Gabs.png",
    apple: "/branding/Nails%20by%20Gabs.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ user, profile }, activeThemeId] = await Promise.all([
    getSessionProfile(),
    getActiveThemeId(),
  ]);

  return (
    <html lang="en" data-theme={activeThemeId}>
      <body
        className={`${dmSans.variable} ${cormorant.variable} app-body antialiased`}
      >
        <SidebarProvider
          defaultOpen={false}
          className="!min-h-0 min-h-0 w-full flex-1 md:!min-h-svh md:h-auto"
        >
          <AppSidebar profile={profile} email={user?.email} />
          <SidebarInset className="mobile-ambient-bg flex min-h-0 flex-1 flex-col overflow-hidden md:overflow-visible">
            <div className="app-scroll-region flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain md:overflow-visible">
              <PageMotion>{children}</PageMotion>
            </div>
            <MobileBottomNav isOwner={profile?.role === "owner"} />
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
