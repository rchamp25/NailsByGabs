import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

export default function SignUpPage() {
  return (
    <AuthPageShell title="Sign up">
      <AuthForm mode="signup" />
    </AuthPageShell>
  );
}
