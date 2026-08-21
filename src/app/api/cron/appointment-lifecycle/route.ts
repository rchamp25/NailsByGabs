import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daily (Vercel Hobby) or external cron: mark completed appointments after their 24-hour grace window. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service role client unavailable" },
      { status: 503 }
    );
  }

  const { data: completedCount, error: completeError } = await admin.rpc(
    "mark_completed_appointments"
  );

  if (completeError) {
    console.error("[cron] mark_completed_appointments:", completeError.message);
    return NextResponse.json({ error: completeError.message }, { status: 500 });
  }

  return NextResponse.json({
    completed: completedCount ?? 0,
  });
}
