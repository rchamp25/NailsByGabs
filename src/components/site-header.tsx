import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { getSessionProfile } from "@/lib/auth";

export async function SiteHeader({
  title,
  actions,
}: {
  title: string;
  /** Extra controls shown at the right of the header on all screen sizes. */
  actions?: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();

  // Mobile only: on desktop the pinned DesktopNav (in the root layout) shows
  // the current page, so the title is kept for screen readers only.
  return (
    <>
    <h1 className="sr-only hidden md:block">{title}</h1>
    <header className="border-border/60 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm transition-[background-color,box-shadow] duration-350 ease-emphasis site-header-shadow md:hidden">
      <h1 className="seasonal-title font-serif min-w-0 flex-1 truncate text-xl text-foreground">
        {title}
      </h1>
      {actions}
      <div className="flex shrink-0 items-center gap-2">
        {!profile ? (
          <Link
            href="/auth/login"
            className="text-sm font-medium text-primary hover:text-accent"
          >
            Sign in
          </Link>
        ) : (
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground text-xs font-medium hover:text-primary"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </header>
    </>
  );
}
