import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

type SessionUser = { id: string; email?: string };

/**
 * Current user and profile. Cached per request so the layout, header, page and
 * actions share one Supabase auth round trip.
 */
export const getSessionProfile = cache(
  async (): Promise<{
    user: SessionUser | null;
    profile: Profile | null;
  }> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      // "*" rather than a column list so newly added columns (e.g. loyalty_member,
      // migration 017) can't break sign-in if code deploys before the migration.
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      user: { id: user.id, email: user.email },
      profile: profile as Profile | null,
    };
  }
);

/** The Loyalty page is for flagged members; the owner can always see it. */
export function canSeeLoyalty(profile: Profile | null): boolean {
  return !!profile && (profile.role === "owner" || profile.loyalty_member === true);
}

/** Owner session, or null for signed-out users and clients. Use in Server Actions. */
export async function getOwnerSession(): Promise<{
  user: SessionUser;
  profile: Profile;
} | null> {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || profile.role !== "owner") {
    return null;
  }
  return { user, profile };
}

/** Owner session, redirecting everyone else. Use in owner-only pages and route handlers. */
export async function requireOwner(redirectTo = "/"): Promise<{
  user: SessionUser;
  profile: Profile;
}> {
  const owner = await getOwnerSession();
  if (!owner) {
    redirect(redirectTo);
  }
  return owner;
}
