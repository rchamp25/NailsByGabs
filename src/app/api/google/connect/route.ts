import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { requireOwner } from "@/lib/auth";
import { getGoogleOAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const { user } = await requireOwner("/book");

  const url = getGoogleOAuthUrl(user.id);
  if (!url) {
    redirect("/book?google=not_configured");
  }

  return NextResponse.redirect(url);
}
