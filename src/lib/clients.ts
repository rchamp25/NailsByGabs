import "server-only";

import type { User } from "@supabase/supabase-js";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export type OwnerClientRow = {
  id: string;
  fullName: string;
  email: string | null;
  emailVerified: boolean;
  createdAt: string;
  appointmentsBooked: number;
  appointmentsCompleted: number;
};

async function listAllAuthUsers(): Promise<User[] | null> {
  const admin = createServiceRoleClient();
  if (!admin) return null;

  const users: User[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[clients] listUsers failed:", error.message);
      return null;
    }

    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

/** Owner-only client list with auth email and verification status. */
export async function listOwnerClients(): Promise<{
  clients: OwnerClientRow[];
  error?: string;
}> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return {
      clients: [],
      error:
        "Client list is unavailable — SUPABASE_SERVICE_ROLE_KEY is not configured.",
    };
  }

  const [{ data: profiles, error: profilesError }, authUsers] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "id, full_name, created_at, appointments_booked, appointments_completed"
        )
        .eq("role", "client")
        .order("full_name"),
      listAllAuthUsers(),
    ]);

  if (profilesError) {
    return { clients: [], error: profilesError.message };
  }

  if (!authUsers) {
    return {
      clients: [],
      error: "Could not load client accounts from authentication.",
    };
  }

  const authById = new Map(authUsers.map((user) => [user.id, user]));

  const clients: OwnerClientRow[] = (profiles ?? []).map((profile) => {
    const authUser = authById.get(profile.id);
    return {
      id: profile.id,
      fullName: profile.full_name.trim() || "Client",
      email: authUser?.email ?? null,
      emailVerified: !!authUser?.email_confirmed_at,
      createdAt: profile.created_at,
      appointmentsBooked: profile.appointments_booked ?? 0,
      appointmentsCompleted: profile.appointments_completed ?? 0,
    };
  });

  return { clients };
}
