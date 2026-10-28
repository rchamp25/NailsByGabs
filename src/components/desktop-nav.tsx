"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { OwnerMenu } from "@/components/owner-menu";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import {
  isNavItemActive,
  LOYALTY_NAV,
  OWNER_MENU_NAV,
  OWNER_NAV,
  PUBLIC_NAV,
  type NavItem,
} from "@/lib/nav";
import { cn } from "@/lib/utils";

type DesktopNavProps = {
  isOwner: boolean;
  isSignedIn: boolean;
  /** Loyalty members (and the owner) get the Loyalty tab. */
  showLoyalty: boolean;
};

const tabClass =
  "shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-300 ease-luxury lg:px-4";

function tabStateClass(active: boolean): string {
  return active
    ? "border-accent/40 bg-primary/10 text-primary"
    : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent";
}

/** Breakpoint from which a tab shows its full label (short label below it). */
const FULL_LABEL_FROM = {
  xl: ["xl:hidden", "hidden xl:inline"],
  "2xl": ["2xl:hidden", "hidden 2xl:inline"],
} as const;

function NavTab({
  item,
  pathname,
  fullLabelFrom,
}: {
  item: NavItem;
  pathname: string;
  fullLabelFrom: keyof typeof FULL_LABEL_FROM;
}) {
  const active = isNavItemActive(item.href, pathname);
  const [shortClass, fullClass] = FULL_LABEL_FROM[fullLabelFrom];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(tabClass, tabStateClass(active))}
    >
      <span className={shortClass}>{item.short}</span>
      <span className={fullClass}>{item.label}</span>
    </Link>
  );
}

/**
 * Desktop navigation: one bar pinned to the top with every page as a labeled
 * tab (the mobile bottom bar's counterpart). Hidden below md.
 *
 * Fits half-width (split-screen) windows: tabs use short labels below xl
 * (below 2xl for the owner, who has ten), and below xl the owner's pages fold
 * into an "Owner" dropdown like the mobile bar. The dropdown sits outside the
 * scrollable tab row so the row's overflow can't clip it.
 */
export function DesktopNav({ isOwner, isSignedIn, showLoyalty }: DesktopNavProps) {
  const pathname = usePathname();
  const fullLabelFrom = isOwner ? "2xl" : "xl";

  return (
    <header className="sticky top-0 z-40 hidden h-16 shrink-0 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur-sm md:flex lg:gap-6 lg:px-6">
      <Link href="/" className="seasonal-title shrink-0 font-serif text-xl tracking-wide text-primary lg:text-2xl">
        Nails<span className="text-accent">By</span>Gabs
      </Link>

      <div className="flex min-w-0 flex-1 items-center gap-1">
        <nav
          aria-label="Main navigation"
          className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PUBLIC_NAV.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} fullLabelFrom={fullLabelFrom} />
          ))}
          {showLoyalty && !isOwner && (
            <NavTab item={LOYALTY_NAV} pathname={pathname} fullLabelFrom={fullLabelFrom} />
          )}
          {isOwner && (
            <div className="hidden xl:contents">
              <NavTab item={LOYALTY_NAV} pathname={pathname} fullLabelFrom={fullLabelFrom} />
              <span aria-hidden className="mx-2 h-6 w-px shrink-0 bg-border" />
              {OWNER_NAV.map((item) => (
                <NavTab key={item.href} item={item} pathname={pathname} fullLabelFrom={fullLabelFrom} />
              ))}
            </div>
          )}
        </nav>

        {isOwner && (
          <OwnerMenu
            className="relative shrink-0 xl:hidden"
            items={OWNER_MENU_NAV}
            pathname={pathname}
            triggerClassName={({ active, open }) =>
              cn(tabClass, "flex items-center gap-1", tabStateClass(active || open))
            }
            trigger={({ open }) => (
              <>
                Owner
                <ChevronDown
                  className={cn("size-4 transition-transform", open && "rotate-180")}
                  aria-hidden
                />
              </>
            )}
            panelClassName="left-0 top-full mt-2"
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <SocialLinks />
        {isSignedIn ? (
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              Sign out
            </Button>
          </form>
        ) : (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
