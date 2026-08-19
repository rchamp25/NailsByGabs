import { BookingCalendar } from "@/components/booking/booking-calendar";
import { BookingGate } from "@/components/booking/booking-gate";
import { WelcomeBanner } from "@/components/auth/welcome-banner";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile } from "@/lib/auth";
import {
  isGoogleCalendarConnected,
  isGoogleOAuthConfigured,
} from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeAppointmentLocation,
} from "@/lib/appointment-locations";
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
      location,
      booked_by,
      booked_name,
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
      location: normalizeAppointmentLocation(row.location as string | null),
      booked_by: row.booked_by,
      booked_name: row.booked_name,
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
      <div className="page-gradient flex flex-1 flex-col gap-6 p-4 pb-28 md:gap-8 md:p-8 md:pb-8">
        <ScrollReveal>
          <div className="max-w-3xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-accent">
            Appointment calendar
          </p>
          <h2 className="font-serif mt-1 text-3xl text-primary md:text-5xl">
            Reserve your spot
          </h2>
          <p className="text-muted-foreground rhythm-copy mt-3 text-sm leading-relaxed md:text-base">
            {profile?.role === "owner"
              ? "Add open time slots for clients. Booked appointments show client names."
              : "Choose an open slot and add notes for special requests. Other booked times appear as Taken."}
          </p>
          {profile?.role !== "owner" && user && (
            <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              {["Pick a day", "Choose a slot", "Confirm booking"].map((step, index) => (
                <li
                  key={step}
                  className="rounded-xl border border-accent/25 bg-card/80 px-3 py-2 text-center"
                >
                  <span className="text-accent font-medium">{index + 1}.</span>{" "}
                  {step}
                </li>
              ))}
            </ol>
          )}
          </div>
        </ScrollReveal>

        <WelcomeBanner show={welcome === "1" && !!user} />

        {google === "connected" && profile?.role === "owner" && (
          <p
            className="rounded-xl border border-accent/40 bg-secondary/60 px-4 py-3 text-sm text-primary"
            role="status"
          >
            Google Calendar connected — appointments will sync automatically.
          </p>
        )}

        {google === "disconnected" && profile?.role === "owner" && (
          <p
            className="rounded-xl border border-accent/40 bg-secondary/60 px-4 py-3 text-sm text-primary"
            role="status"
          >
            Google Calendar disconnected. Use Connect to link again.
          </p>
        )}

        {google === "error" && profile?.role === "owner" && (
          <p
            className="rounded-xl border border-primary/40 bg-secondary/60 px-4 py-3 text-sm text-primary"
            role="alert"
          >
            Could not connect Google Calendar. Confirm{" "}
            <code className="text-xs">https://nailsbygabs.org/api/google/callback</code>{" "}
            is in Google Cloud Console, then try Reconnect.
          </p>
        )}

        {google === "disconnect_error" && profile?.role === "owner" && (
          <p
            className="rounded-xl border border-primary/40 bg-secondary/60 px-4 py-3 text-sm text-primary"
            role="alert"
          >
            Could not disconnect. Please try again or contact support.
          </p>
        )}

        {!user || !profile ? (
          <ScrollReveal>
            <BookingGate />
          </ScrollReveal>
        ) : (
          <ScrollReveal>
            <BookingCalendar
              slots={slots}
              profile={profile}
              userId={user.id}
              googleConnected={googleConnected}
              googleConfigured={googleConfigured}
            />
          </ScrollReveal>
        )}
      </div>
    </>
  );
}
