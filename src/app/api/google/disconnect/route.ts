import { redirect } from "next/navigation";

import { getSessionProfile } from "@/lib/auth";
import { disconnectOwnerGoogleCalendar } from "@/lib/google-calendar";
import { getSiteUrl } from "@/lib/site-url";

export async function POST() {
  const siteUrl = getSiteUrl();
  const { user, profile } = await getSessionProfile();

  if (!user || profile?.role !== "owner") {
    redirect(`${siteUrl}/book`);
  }

  const result = await disconnectOwnerGoogleCalendar(user.id);
  if (result.error) {
    redirect(`${siteUrl}/book?google=disconnect_error`);
  }

  redirect(`${siteUrl}/book?google=disconnected`);
}
