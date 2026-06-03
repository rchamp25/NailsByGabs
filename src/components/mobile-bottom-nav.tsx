"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarHeart,
  Images,
  Sparkles,
  UserRound,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  { title: "Portfolio", href: "/", icon: Images, short: "Gallery" },
  { title: "Book", href: "/book", icon: CalendarHeart, short: "Book" },
  { title: "Services", href: "/services", icon: Sparkles, short: "Prices" },
  { title: "About", href: "/about", icon: UserRound, short: "About" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  function handleNavigate() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-sidebar/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden"
      aria-label="Main navigation"
    >
      <ul className="grid h-16 grid-cols-4">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={handleNavigate}
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
}
