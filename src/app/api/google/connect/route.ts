import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getSessionProfile } from "@/lib/auth";
import { getGoogleOAuthUrl } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { user, profile } = await getSessionProfile();

  if (!user || profile?.role !== "owner") {
    redirect("/book");
  }

  const url = getGoogleOAuthUrl(user.id);
  if (!url) {
    redirect("/book?google=not_configured");
  }

  return NextResponse.redirect(url);
}
