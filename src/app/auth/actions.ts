"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfigError, getSupabaseEnv } from "@/lib/supabase/env";
import { getAuthCallbackUrl } from "@/lib/site-url";

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

    if (data.session) {
      return { success: true };
    }

    return {
      success: true,
      message:
        "Account created! Check your email to confirm your NailsByGabs account, then sign in to book.",
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Something went wrong. Try again.",
    };
  }
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

export async function signOut() {
  if (!getSupabaseEnv()) {
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
