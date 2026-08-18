import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, reset } = await searchParams;

  return (
    <AuthPageShell
      title="Sign in"
      banner={
        <>
          {reset === "success" && (
            <p
              className="w-full max-w-md rounded-xl border border-accent/40 bg-secondary/60 px-4 py-3 text-center text-sm text-primary"
              role="status"
            >
              Password updated. Sign in with your new password to book.
            </p>
          )}
          {error === "confirmation" && (
            <p
              className="w-full max-w-md rounded-xl border border-accent/40 bg-secondary/60 px-4 py-3 text-center text-sm text-primary"
              role="alert"
            >
              That confirmation link expired or was already used. Sign in below,
              or sign up again to get a new email.
            </p>
          )}
          {error === "auth" && (
            <p
              className="w-full max-w-md rounded-xl border border-primary/40 bg-secondary/60 px-4 py-3 text-center text-sm text-primary"
              role="alert"
            >
              That link expired or could not be verified. Try signing in or
              request a new password reset.
            </p>
          )}
        </>
      }
    >
      <AuthForm mode="login" />
    </AuthPageShell>
  );
}
