import "server-only";

import { createClient } from "@/lib/supabase/server";

function isValidNotificationEmail(email: string | undefined | null): email is string {
  const trimmed = email?.trim();
  if (!trimmed) return false;
  if (!trimmed.includes("@") || trimmed.includes("example.com")) return false;
  return true;
}

async function readAppConfigEmails(): Promise<{
  notificationEmail: string | null;
  ownerEmail: string | null;
}> {
  const supabase = await createClient();
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
