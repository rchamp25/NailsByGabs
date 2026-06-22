"use server";

import { getSessionProfile } from "@/lib/auth";
import { getPasswordResetCallbackUrl } from "@/lib/site-url";
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
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "owner") {
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
