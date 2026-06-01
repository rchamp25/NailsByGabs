import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/site-header";

export default function LoginPage() {
  return (
    <>
      <SiteHeader title="Sign in" />
      <div className="flex flex-1 flex-col items-center gap-6 p-4 md:p-8">
        <AuthForm mode="login" />
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
