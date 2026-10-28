"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { OwnerMenu } from "@/components/owner-menu";
import {
  isNavItemActive,
  LOYALTY_NAV,
  OWNER_MENU_NAV,
  PUBLIC_NAV,
  type NavItem,
} from "@/lib/nav";
import { cn } from "@/lib/utils";

type MobileBottomNavProps = {
  isOwner?: boolean;
  /** Loyalty members (and the owner) get the Loyalty page. */
  showLoyalty?: boolean;
};

const itemClass =
  "relative z-10 flex h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors duration-300 ease-luxury";

function NavIcon({ item, active }: { item: Pick<NavItem, "icon">; active: boolean }) {
  return (
    <item.icon
      className={cn(
        "size-5 transition-transform duration-300 ease-luxury",
        active && "scale-110 text-accent"
      )}
      aria-hidden
    />
  );
}

export function MobileBottomNav({ isOwner = false, showLoyalty = false }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Members see Loyalty as its own tab; for the owner it lives in the Owner menu.
  const items = useMemo(
    () => (showLoyalty && !isOwner ? [...PUBLIC_NAV, LOYALTY_NAV] : PUBLIC_NAV),
    [isOwner, showLoyalty]
  );
  const ownerActive =
    isOwner && OWNER_MENU_NAV.some((item) => isNavItemActive(item.href, pathname));
  const slotCount = items.length + (isOwner ? 1 : 0);
  const activeIndex = ownerActive
    ? items.length
    : items.findIndex((item) => isNavItemActive(item.href, pathname));

  if (!mounted || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav
      className="mobile-bottom-nav pill-nav-shell shrink-0 md:hidden"
      aria-label="Main navigation"
    >
      <div className="relative px-2 pt-2 pb-2">
        {activeIndex >= 0 && (
          <div
            className="pill-nav-indicator pointer-events-none absolute top-2 bottom-2 rounded-full transition-transform duration-350 ease-emphasis"
            style={{
              width: `calc((100% - 1rem) / ${slotCount})`,
              transform: `translateX(calc(${activeIndex} * 100%))`,
            }}
          />
        )}
        <ul
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const isActive = isNavItemActive(item.href, pathname);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(itemClass, isActive ? "text-primary" : "text-muted-foreground")}
                >
                  <NavIcon item={item} active={isActive} />
                  <span>{item.short}</span>
                </Link>
              </li>
            );
          })}
          {isOwner && (
            <li>
              {/* Panel is positioned against the bar's padded wrapper, opening upward. */}
              <OwnerMenu
                items={OWNER_MENU_NAV}
                pathname={pathname}
                triggerClassName={({ active, open }) =>
                  cn(itemClass, active || open ? "text-primary" : "text-muted-foreground")
                }
                trigger={({ active }) => (
                  <>
                    <NavIcon item={{ icon: ShieldCheck }} active={active} />
                    <span>Owner</span>
                  </>
                )}
                panelClassName="right-2 bottom-full mb-2"
              />
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
