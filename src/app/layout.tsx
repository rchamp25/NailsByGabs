import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { CursorFloralTrail } from "@/components/cursor-floral-trail";
import { PageMotion } from "@/components/page-motion";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSessionProfile } from "@/lib/auth";

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
  title: "NailsByGabs | Premium Nail Artistry",
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
        <CursorFloralTrail />
        <SidebarProvider defaultOpen>
          <AppSidebar profile={profile} email={user?.email} />
          <SidebarInset>
            <PageMotion>{children}</PageMotion>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
