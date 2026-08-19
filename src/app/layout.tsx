import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PageMotion } from "@/components/page-motion";
import { SidebarPeekTab } from "@/components/sidebar-peek-tab";
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
      <body className={`${dmSans.variable} ${cormorant.variable} antialiased`}>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar profile={profile} email={user?.email} />
          <SidebarPeekTab />
          <SidebarInset className="mobile-ambient-bg">
            <div className="flex min-h-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <PageMotion>{children}</PageMotion>
            </div>
          </SidebarInset>
        </SidebarProvider>
        <MobileBottomNav isOwner={profile?.role === "owner"} />
      </body>
    </html>
  );
}
