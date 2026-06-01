import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/book";
  const safeNext = next.startsWith("/") ? next : "/book";
  const siteUrl = getSiteUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = safeNext.includes("?")
        ? `${safeNext}&welcome=1`
        : `${safeNext}?welcome=1`;
      return NextResponse.redirect(`${siteUrl}${destination}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/auth/login?error=confirmation`);
}
