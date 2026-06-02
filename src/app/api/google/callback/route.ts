import { NextResponse } from "next/server";

import { getSessionProfile } from "@/lib/auth";
import { exchangeGoogleCode } from "@/lib/google-calendar";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const siteUrl = getSiteUrl();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const { user, profile } = await getSessionProfile();

  if (!user || profile?.role !== "owner" || !code || state !== user.id) {
    return NextResponse.redirect(`${siteUrl}/book?google=error`);
  }

  const refreshToken = await exchangeGoogleCode(code);
  if (!refreshToken) {
    return NextResponse.redirect(`${siteUrl}/book?google=error`);
  }

  const supabase = await createClient();
  const { error: upsertError } = await supabase.from("owner_integrations").upsert(
    {
      owner_id: user.id,
      google_refresh_token: refreshToken,
      google_calendar_id: "primary",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" }
  );

  if (upsertError) {
    return NextResponse.redirect(`${siteUrl}/book?google=error`);
  }

  return NextResponse.redirect(`${siteUrl}/book?google=connected`);
}
