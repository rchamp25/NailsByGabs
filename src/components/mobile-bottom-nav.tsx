"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarHeart,
  Images,
  Palette,
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

const ownerItems = [
  { title: "Clients", href: "/clients", icon: Users, short: "Clients" },
  { title: "Theme", href: "/settings", icon: Palette, short: "Theme" },
] as const;

type MobileBottomNavProps = {
  isOwner?: boolean;
};

export function MobileBottomNav({ isOwner = false }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useMemo(
    () => (isOwner ? [...baseItems, ...ownerItems] : [...baseItems]),
    [isOwner]
  );

  const activeIndex = items.findIndex((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname.startsWith(item.href)
  );

  if (!mounted || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav
      className="mobile-bottom-nav pill-nav-shell shrink-0 md:hidden"
      aria-label="Main navigation"
    >
      <div className="relative px-2 pt-2 pb-2">
        <div
          className="pill-nav-indicator pointer-events-none absolute top-2 bottom-2 rounded-full transition-transform duration-350 ease-emphasis"
          style={{
            width: `calc((100% - 1rem) / ${items.length})`,
            transform: `translateX(calc(${Math.max(activeIndex, 0)} * 100%))`,
          }}
        />
        <ul
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
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
                    "relative z-10 flex h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors duration-300 ease-luxury",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-5 transition-transform duration-300 ease-luxury",
                      isActive && "scale-110 text-accent"
                    )}
                    aria-hidden
                  />
                  <span>{item.short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
