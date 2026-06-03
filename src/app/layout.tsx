import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PageMotion } from "@/components/page-motion";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSessionProfile } from "@/lib/auth";
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
  title: "NailsByGabs | GelX Nails",
  description:
    "Luxury nail salon — portfolio, booking, services, and more. Book your appointment with Gabs today.",
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
  const { user, profile } = await getSessionProfile();

  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${cormorant.variable} antialiased`}>
        <SidebarProvider defaultOpen>
          <AppSidebar profile={profile} email={user?.email} />
          <SidebarInset className="mobile-ambient-bg">
            <div className="flex min-h-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <PageMotion>{children}</PageMotion>
            </div>
            <MobileBottomNav />
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
