import { BookingCalendar } from "@/components/booking/booking-calendar";
import { BookingGate } from "@/components/booking/booking-gate";
import { WelcomeBanner } from "@/components/auth/welcome-banner";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile } from "@/lib/auth";
import {
  isGoogleCalendarConnected,
  isGoogleOAuthConfigured,
} from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import type { SlotWithBooker } from "@/types/database";

async function getUpcomingSlots(): Promise<SlotWithBooker[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("appointment_slots")
    .select(
      `
      id,
      start_at,
      end_at,
      status,
      booked_by,
      notes,
      created_at,
      booker:profiles!booked_by (
        full_name
      )
    `
    )
    .gte("end_at", now)
    .order("start_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const bookerRaw = row.booker as
      | { full_name: string }
      | { full_name: string }[]
      | null;
    const booker = Array.isArray(bookerRaw) ? bookerRaw[0] : bookerRaw;

    return {
      id: row.id,
      start_at: row.start_at,
      end_at: row.end_at,
      status: row.status as SlotWithBooker["status"],
      booked_by: row.booked_by,
      notes: row.notes,
      created_at: row.created_at,
      booker: booker ?? null,
    } satisfies SlotWithBooker;
  });
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; google?: string }>;
}) {
  const { user, profile } = await getSessionProfile();
  const { welcome, google } = await searchParams;
  const slots = user && profile ? await getUpcomingSlots() : [];

  const googleConnected =
    profile?.role === "owner" && user
      ? await isGoogleCalendarConnected(user.id)
      : false;
  const googleConfigured = isGoogleOAuthConfigured();

  return (
    <>
      <SiteHeader title="Book Appointment" />
      <div className="main-floral-accent flex flex-1 flex-col gap-6 p-4 pb-24 md:p-8 md:pb-8">
        <div className="max-w-3xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-gold">
            Appointment calendar
          </p>
          <h2 className="font-serif mt-1 text-3xl text-rose-red md:text-5xl">
            Reserve your spot
          </h2>
          <p className="text-muted-foreground rhythm-copy mt-3 text-sm leading-relaxed md:text-base">
            {profile?.role === "owner"
              ? "Add open time slots for clients. Booked appointments show client names."
              : "Choose an open slot and add notes for special requests. Other booked times appear as Taken."}
          </p>
        </div>

        <WelcomeBanner show={welcome === "1" && !!user} />

        {google === "connected" && profile?.role === "owner" && (
          <p
            className="rounded-xl border border-gold/40 bg-pastel-pink/60 px-4 py-3 text-sm text-rose-red-deep"
            role="status"
          >
            Google Calendar connected — appointments will sync automatically.
          </p>
        )}

        {!user || !profile ? (
          <BookingGate />
        ) : (
          <BookingCalendar
            slots={slots}
            profile={profile}
            userId={user.id}
            googleConnected={googleConnected}
            googleConfigured={googleConfigured}
          />
        )}
      </div>
    </>
  );
}
