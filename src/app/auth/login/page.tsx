import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/site-header";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <>
      <SiteHeader title="Sign in" />
      <div className="flex flex-1 flex-col items-center gap-6 p-4 md:p-8">
        {error === "confirmation" && (
          <p
            className="max-w-md rounded-xl border border-gold/40 bg-pastel-pink/60 px-4 py-3 text-center text-sm text-rose-red-deep"
            role="alert"
          >
            That confirmation link expired or was already used. Sign in below, or
            sign up again to get a new email.
          </p>
        )}
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
