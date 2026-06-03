import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

type AuthPageShellProps = {
  title: string;
  children: React.ReactNode;
  banner?: React.ReactNode;
};

export function AuthPageShell({ title, children, banner }: AuthPageShellProps) {
  return (
    <>
      <SiteHeader title={title} />
      <div className="page-gradient flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col items-center justify-center gap-6 p-4 pb-24 md:min-h-0 md:p-8 md:pb-12">
        {banner}
        <div className="w-full max-w-md">{children}</div>
        <Link
          href="/"
          className="text-muted-foreground text-sm hover:text-rose-red"
        >
          ← Back to site
        </Link>
      </div>
    </>
  );
}
