import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { getSessionProfile } from "@/lib/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";

export async function SiteHeader({ title }: { title: string }) {
  const { profile } = await getSessionProfile();

  return (
    <header className="border-border/60 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm transition-[background-color,box-shadow] duration-350 ease-luxury md:px-6 max-md:shadow-[0_4px_24px_-12px_rgb(140_207_155_/_0.45)]">
      <SidebarTrigger className="hidden text-rose-red transition-colors duration-300 ease-luxury hover:text-gold md:inline-flex" />
      <div className="hidden h-5 w-px bg-gold/40 md:block" />
      <h1 className="font-serif min-w-0 flex-1 truncate text-xl text-foreground md:text-2xl">
        {title}
      </h1>
      <div className="flex shrink-0 items-center gap-2 md:hidden">
        {!profile ? (
          <Link
            href="/auth/login"
            className="text-sm font-medium text-rose-red hover:text-gold"
          >
            Sign in
          </Link>
        ) : (
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground text-xs font-medium hover:text-rose-red"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
