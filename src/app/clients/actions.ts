"use server";

import { getOwnerSession } from "@/lib/auth";
import { getAuthCallbackUrl, getPasswordResetCallbackUrl } from "@/lib/site-url";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfigError, getSupabaseEnv } from "@/lib/supabase/env";

export type ClientsActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function sendClientPasswordReset(
  _prev: ClientsActionState | null,
  formData: FormData
): Promise<ClientsActionState> {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can send password reset emails." };
  }

  if (!getSupabaseEnv()) {
    return { error: getSupabaseConfigError() };
  }

  const clientId = String(formData.get("clientId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!clientId || !email) {
    return { error: "Missing client email." };
  }

  try {
    const supabase = await createClient();
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", clientId)
      .maybeSingle();

    if (!clientProfile || clientProfile.role !== "client") {
      return { error: "Client account not found." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetCallbackUrl(),
    });

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      message: `Password reset email sent to ${email}.`,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Something went wrong. Try again.",
    };
  }
}

export async function sendClientVerificationEmail(
  _prev: ClientsActionState | null,
  formData: FormData
): Promise<ClientsActionState> {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can resend verification emails." };
  }

  if (!getSupabaseEnv()) {
    return { error: getSupabaseConfigError() };
  }

  const clientId = String(formData.get("clientId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!clientId || !email) {
    return { error: "Missing client email." };
  }

  try {
    const supabase = await createClient();
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", clientId)
      .maybeSingle();

    if (!clientProfile || clientProfile.role !== "client") {
      return { error: "Client account not found." };
    }

    const admin = createServiceRoleClient();
    if (!admin) {
      return {
        error:
          "Verification resend is unavailable — SUPABASE_SERVICE_ROLE_KEY is not configured.",
      };
    }

    const { data: authUser, error: authError } =
      await admin.auth.admin.getUserById(clientId);

    if (authError || !authUser.user) {
      return { error: "Client auth account not found." };
    }

    if (authUser.user.email_confirmed_at) {
      return { error: "This account is already verified." };
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      message: `Verification email sent to ${email}.`,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Something went wrong. Try again.",
    };
  }
}
