"use server";

import { revalidatePath } from "next/cache";

import { getOwnerSession } from "@/lib/auth";
import { notifyClientOfLoyaltyMembership } from "@/lib/notifications";
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

/**
 * Add or remove a client from the loyalty program. The set_loyalty_member RPC
 * (migration 017) checks the owner and returns true only when the client was
 * newly added, which is when the welcome email goes out. Removal sends nothing.
 */
export async function setLoyaltyMembership(
  _prev: ClientsActionState | null,
  formData: FormData
): Promise<ClientsActionState> {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can change loyalty membership." };
  }

  if (!getSupabaseEnv()) {
    return { error: getSupabaseConfigError() };
  }

  const clientId = String(formData.get("clientId") ?? "").trim();
  const member = formData.get("member") === "true";

  if (!clientId) {
    return { error: "Missing client." };
  }

  try {
    const supabase = await createClient();
    const { data: newlyAdded, error } = await supabase.rpc("set_loyalty_member", {
      p_client_id: clientId,
      p_member: member,
    });

    if (error) {
      return {
        error: error.message.includes("set_loyalty_member")
          ? "Loyalty membership needs database migration 017."
          : error.message,
      };
    }

    if (newlyAdded === true) {
      await notifyClientOfLoyaltyMembership(clientId);
    }

    revalidatePath("/clients");
    return {
      success: true,
      message: member
        ? newlyAdded
          ? "Added to the loyalty program. Welcome email sent."
          : "Already a loyalty member."
        : "Removed from the loyalty program.",
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Something went wrong. Try again.",
    };
  }
}
