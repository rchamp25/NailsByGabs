import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Creepster, DM_Sans } from "next/font/google";

import { DesktopNav } from "@/components/desktop-nav";
import { HalloweenFog, HalloweenPumpkins } from "@/components/effects/halloween";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PageMotion } from "@/components/page-motion";
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

// Halloween titles only (.seasonal-title). Not preloaded: browsers download it
// only when an element actually uses it, i.e. while the halloween theme is on.
const creepster = Creepster({
  variable: "--font-creepster",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_SITE_URL),
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  openGraph: defaultOpenGraph,
  twitter: defaultTwitter,
  icons: {
    icon: "/branding/NailsByGabsIcon.png",
    shortcut: "/branding/NailsByGabsIcon.png",
    apple: "/branding/NailsByGabsIcon.png",
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
  const isHalloween = activeThemeId === "halloween";

  return (
    <html lang="en" data-theme={activeThemeId}>
      <body
        className={`${dmSans.variable} ${cormorant.variable} ${creepster.variable} app-body antialiased`}
      >
        {/* Mobile: a fixed-height column where only .app-scroll-region
            scrolls, so the bottom nav stays pinned (incl. Instagram's
            in-app browser). Desktop: normal window scrolling. */}
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden md:h-auto md:min-h-svh md:overflow-visible">
          <main className="mobile-ambient-bg bg-background relative flex min-h-0 w-full flex-1 flex-col overflow-hidden md:overflow-visible">
            <DesktopNav isOwner={profile?.role === "owner"} isSignedIn={!!user} />
            {isHalloween && <HalloweenPumpkins />}
            <div className="app-scroll-region flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain md:overflow-visible">
              <PageMotion>{children}</PageMotion>
            </div>
            {isHalloween && <HalloweenFog />}
            <MobileBottomNav isOwner={profile?.role === "owner"} />
          </main>
        </div>
      </body>
    </html>
  );
}
