"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { isNavItemActive, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

type OwnerMenuProps = {
  items: NavItem[];
  pathname: string;
  /** Trigger contents; receives whether a menu page is current or the menu is open. */
  trigger: (state: { active: boolean; open: boolean }) => React.ReactNode;
  triggerClassName: (state: { active: boolean; open: boolean }) => string;
  /** Positions the panel (e.g. above the mobile bar, below the desktop tab). */
  panelClassName: string;
  className?: string;
};

/**
 * Owner pages folded behind one nav item (mobile bar, and the desktop bar when
 * the window is too narrow for every tab). The panel is absolutely positioned
 * by the caller, never position: fixed (misbehaves in Instagram's browser).
 * Closes on navigation, an outside tap, or Escape.
 */
export function OwnerMenu({
  items,
  pathname,
  trigger,
  triggerClassName,
  panelClassName,
  className,
}: OwnerMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = items.some((item) => isNavItemActive(item.href, pathname));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName({ active, open })}
      >
        {trigger({ active, open })}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "bg-background absolute z-50 w-48 overflow-hidden rounded-2xl border border-accent/30 py-1 shadow-lg",
            panelClassName
          )}
        >
          {items.map((item) => {
            const itemActive = isNavItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={itemActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-11 items-center gap-3 px-4 text-sm font-medium transition-colors",
                  itemActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className={cn("size-4", itemActive && "text-accent")} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
