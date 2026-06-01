import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getSessionProfile(): Promise<{
  user: { id: string; email?: string } | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", user.id)
    .single();

  return {
    user: { id: user.id, email: user.email },
    profile: profile as Profile | null,
  };
}

export function formatOwnerSlotLabel(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Client appointment";
  if (trimmed.toLowerCase().endsWith("nails")) return trimmed;
  return `${trimmed}'s Nails`;
}
