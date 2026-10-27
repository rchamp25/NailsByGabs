"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfigError, getSupabaseEnv } from "@/lib/supabase/env";
import { getAuthCallbackUrl, getPasswordResetCallbackUrl } from "@/lib/site-url";

export type AuthActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function signUp(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  if (!getSupabaseEnv()) {
    return { error: getSupabaseConfigError() };
  }

  let signedIn = false;

  try {
    const supabase = await createClient();

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();

    if (!email || !password || !fullName) {
      return { error: "Please fill in all fields." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    signedIn = !!data.session;
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Something went wrong. Try again.",
    };
  }

  // redirect() throws NEXT_REDIRECT, so it must run outside the try/catch.
  // A session exists only when email confirmation is disabled (e.g. local Supabase).
  if (signedIn) {
    redirect("/book");
  }

  return {
    success: true,
    message:
      "Account created! Check your email, click the verification link to confirm your account, then sign in to book.",
  };
}

export async function signIn(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  if (!getSupabaseEnv()) {
    return { error: getSupabaseConfigError() };
  }

  try {
    const supabase = await createClient();

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { error: "Please enter email and password." };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Something went wrong. Try again.",
    };
  }
}

export async function requestPasswordReset(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  if (!getSupabaseEnv()) {
    return { error: getSupabaseConfigError() };
  }

  try {
    const email = String(formData.get("email") ?? "").trim();
    if (!email) {
      return { error: "Please enter your email address." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetCallbackUrl(),
    });

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      message:
        "If an account exists for that email, we sent a link to reset your password. Check your inbox and spam folder.",
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Something went wrong. Try again.",
    };
  }
}

export async function updatePassword(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  if (!getSupabaseEnv()) {
    return { error: getSupabaseConfigError() };
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return { error: "Please fill in both password fields." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error:
          "This reset link expired or was already used. Request a new link below.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: error.message };
    }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Something went wrong. Try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/auth/login?reset=success");
}

export async function signOut() {
  if (!getSupabaseEnv()) {
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
