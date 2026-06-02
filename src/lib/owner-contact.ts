import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getOwnerNotificationEmail(): Promise<string | null> {
  const emailFromEnv = process.env.OWNER_NOTIFICATION_EMAIL?.trim();
  if (emailFromEnv) {
    return emailFromEnv;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "owner_email")
      .maybeSingle();

    const email = data?.value?.trim();
    return email && !email.includes("example.com") ? email : null;
  } catch {
    return null;
  }
}
