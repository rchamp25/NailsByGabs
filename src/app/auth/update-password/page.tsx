import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export default async function UpdatePasswordPage() {
  let hasSession = false;

  if (getSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasSession = !!user;
  }

  return (
    <AuthPageShell title="New password">
      <UpdatePasswordForm hasSession={hasSession} />
    </AuthPageShell>
  );
}
