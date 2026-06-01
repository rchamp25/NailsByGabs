"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarHeart,
  Images,
  Sparkles,
  UserRound,
} from "lucide-react";

import { SidebarAuth } from "@/components/sidebar-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { Profile } from "@/types/database";

const navItems = [
  { title: "Portfolio", href: "/", icon: Images },
  { title: "Book Appointment", href: "/book", icon: CalendarHeart },
  { title: "Services & Pricing", href: "/services", icon: Sparkles },
  { title: "About Gabs", href: "/about", icon: UserRound },
];

type AppSidebarProps = {
  profile: Profile | null;
  email?: string;
};

export function AppSidebar({ profile, email }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/80 px-4 py-5">
        <Link
          href="/"
          className="flex flex-col gap-0.5 group-data-[collapsible=icon]:items-center"
        >
          <span className="font-serif text-2xl tracking-wide text-rose-red group-data-[collapsible=icon]:text-lg">
            Nails
            <span className="text-gold">By</span>
            Gabs
          </span>
          <span className="text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
            Premium nail artistry
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="text-gold" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 p-4">
        <SidebarAuth profile={profile} email={email} />
      </SidebarFooter>
      <SidebarSeparator className="mx-0" />
    </Sidebar>
  );
}
