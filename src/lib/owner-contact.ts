import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Local development delivers to Mailpit, which accepts any address, so the
 * seeded placeholder owner (gabs@example.com) is a valid recipient there.
 */
function isLocalMailpit(): boolean {
  return process.env.NODE_ENV !== "production" && !!process.env.DEV_MAILPIT_URL?.trim();
}

function isValidNotificationEmail(email: string | undefined | null): email is string {
  const trimmed = email?.trim();
  if (!trimmed || !trimmed.includes("@")) return false;
  // Skip the placeholder from migration 001 so production never emails it.
  if (trimmed.includes("example.com") && !isLocalMailpit()) return false;
  return true;
}

async function readAppConfigEmails(): Promise<{
  notificationEmail: string | null;
  ownerEmail: string | null;
}> {
  // app_config is owner-only under RLS; this runs during client bookings.
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { notificationEmail: null, ownerEmail: null };
  }

  const { data, error } = await supabase
    .from("app_config")
    .select("key, value")
    .in("key", ["owner_notification_email", "owner_email"]);

  if (error) {
    console.error("[owner-contact] Failed to read app_config:", error.message);
    return { notificationEmail: null, ownerEmail: null };
  }

  const byKey = new Map(data?.map((row) => [row.key, row.value.trim()]) ?? []);

  const notificationRaw = byKey.get("owner_notification_email");
  const ownerRaw = byKey.get("owner_email");

  return {
    notificationEmail: isValidNotificationEmail(notificationRaw)
      ? notificationRaw
      : null,
    ownerEmail: isValidNotificationEmail(ownerRaw) ? ownerRaw : null,
  };
}

/**
 * Recipient for booking alert emails.
 * Priority: OWNER_NOTIFICATION_EMAIL env → owner_notification_email → owner_email
 */
export async function getOwnerNotificationEmail(): Promise<string | null> {
  const emailFromEnv = process.env.OWNER_NOTIFICATION_EMAIL?.trim();
  if (isValidNotificationEmail(emailFromEnv)) {
    return emailFromEnv;
  }

  try {
    const { notificationEmail, ownerEmail } = await readAppConfigEmails();
    return notificationEmail ?? ownerEmail;
  } catch {
    return null;
  }
}
