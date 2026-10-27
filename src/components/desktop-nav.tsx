"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { isNavItemActive, OWNER_NAV, PUBLIC_NAV, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

type DesktopNavProps = {
  isOwner: boolean;
  isSignedIn: boolean;
};

function NavTab({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavItemActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ease-luxury",
        active
          ? "border-accent/40 bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent"
      )}
    >
      {item.label}
    </Link>
  );
}

/**
 * Desktop navigation: one bar pinned to the top with every page as a labeled
 * tab (the mobile bottom bar's counterpart). Hidden below md.
 */
export function DesktopNav({ isOwner, isSignedIn }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden h-16 shrink-0 items-center gap-6 border-b border-border/60 bg-background/90 px-6 backdrop-blur-sm md:flex">
      <Link href="/" className="seasonal-title shrink-0 font-serif text-2xl tracking-wide text-primary">
        Nails<span className="text-accent">By</span>Gabs
      </Link>

      <nav
        aria-label="Main navigation"
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PUBLIC_NAV.map((item) => (
          <NavTab key={item.href} item={item} pathname={pathname} />
        ))}
        {isOwner && (
          <>
            <span aria-hidden className="mx-2 h-6 w-px shrink-0 bg-border" />
            {OWNER_NAV.map((item) => (
              <NavTab key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>

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
