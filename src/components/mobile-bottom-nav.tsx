"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  CalendarHeart,
  Images,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const baseItems = [
  { title: "Portfolio", href: "/", icon: Images, short: "Gallery" },
  { title: "Book", href: "/book", icon: CalendarHeart, short: "Book" },
  { title: "Services", href: "/services", icon: Sparkles, short: "Prices" },
  { title: "About", href: "/about", icon: UserRound, short: "About" },
] as const;

const ownerItem = {
  title: "Clients",
  href: "/clients",
  icon: Users,
  short: "Clients",
} as const;

type MobileBottomNavProps = {
  isOwner?: boolean;
};

export function MobileBottomNav({ isOwner = false }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname.startsWith("/auth")) {
    return null;
  }

  const items = isOwner ? [...baseItems, ownerItem] : [...baseItems];

  const nav = (
    <nav
      className="mobile-bottom-nav md:hidden"
      aria-label="Main navigation"
    >
      <ul
        className={cn(
          "grid h-16",
          isOwner ? "grid-cols-5" : "grid-cols-4"
        )}
      >
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors duration-300 ease-luxury",
                  isActive
                    ? "text-rose-red"
                    : "text-muted-foreground hover:text-rose-red-deep"
                )}
              >
                <item.icon
                  className={cn(
                    "size-5 transition-transform duration-300 ease-luxury",
                    isActive && "scale-110 text-gold"
                  )}
                  aria-hidden
                />
                <span>{item.short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return createPortal(nav, document.body);
}
