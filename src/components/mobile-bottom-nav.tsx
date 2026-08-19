"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
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
  const [isDesktop, setIsDesktop] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");

    function sync() {
      setIsDesktop(media.matches);
      if (!media.matches) {
        setDockOpen(false);
      }
    }

    setMounted(true);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
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

  const nav = (
    <div
      className={cn(
        "bottom-nav-dock pointer-events-none fixed inset-x-0 bottom-0 z-[200]",
        isDesktop && dockOpen && "is-open"
      )}
      onMouseEnter={() => isDesktop && setDockOpen(true)}
      onMouseLeave={() => isDesktop && setDockOpen(false)}
      onFocusCapture={() => isDesktop && setDockOpen(true)}
      onBlurCapture={(event) => {
        if (!isDesktop) return;
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setDockOpen(false);
      }}
    >
      {isDesktop && (
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-0 h-5"
          aria-hidden
        />
      )}
      <nav
        className={cn(
          "mobile-bottom-nav pill-nav-shell pointer-events-auto w-full",
          isDesktop &&
            "transition-transform duration-350 ease-emphasis will-change-transform",
          isDesktop &&
            (dockOpen
              ? "translate-y-0"
              : "translate-y-[calc(100%-0.875rem)]")
        )}
        aria-label="Main navigation"
      >
        {isDesktop && !dockOpen && (
          <div
            className="border-accent/35 absolute inset-x-8 top-2 h-0.5 rounded-full bg-accent/50"
            aria-hidden
          />
        )}
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
                      "relative z-10 flex h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors duration-300 ease-luxury md:text-[11px]",
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
    </div>
  );

  return createPortal(nav, document.body);
}
