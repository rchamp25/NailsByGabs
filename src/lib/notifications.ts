import "server-only";

import { formatOwnerSlotLabel } from "@/lib/booking-display";
import { formatSlotRange } from "@/lib/dates";
import { getOwnerNotificationEmail } from "@/lib/owner-contact";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

type BookingNotificationDetails = {
  clientName: string;
  timeRange: string;
  notes: string | null;
};

async function getBookingDetails(
  slotId: string
): Promise<BookingNotificationDetails | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointment_slots")
    .select(
      `
      start_at,
      end_at,
      notes,
      booker:profiles!booked_by ( full_name )
    `
    )
    .eq("id", slotId)
    .maybeSingle();

  if (!data) return null;

  const bookerRaw = data.booker as
    | { full_name: string }
    | { full_name: string }[]
    | null;
  const booker = Array.isArray(bookerRaw) ? bookerRaw[0] : bookerRaw;
  const clientName = formatOwnerSlotLabel(booker?.full_name ?? "Client");

  return {
    clientName,
    timeRange: formatSlotRange(data.start_at, data.end_at),
    notes: data.notes,
  };
}

function buildEmailHtml(details: BookingNotificationDetails): string {
  const siteUrl = getSiteUrl();
  return `
    <div style="font-family:Georgia,serif;color:#3d1f2a;max-width:480px">
      <h2 style="color:#c62828">New appointment booked</h2>
      <p><strong>${details.clientName}</strong> just reserved a slot on NailsByGabs.</p>
      <p><strong>When:</strong> ${details.timeRange}</p>
      ${
        details.notes
          ? `<p><strong>Client notes:</strong> ${details.notes}</p>`
          : ""
      }
      <p style="margin-top:24px">
        <a href="${siteUrl}/book" style="background:#c62828;color:#fff8fa;padding:12px 20px;border-radius:8px;text-decoration:none;border:1px solid #c9a227">
          View calendar
        </a>
      </p>
    </div>
  `;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL ?? "NailsByGabs <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  return response.ok;
}

/** Email Gabs when a client books. Free via Resend (3,000 emails/mo). Never throws. */
export async function notifyOwnerOfBooking(slotId: string): Promise<void> {
  try {
    const [details, email] = await Promise.all([
      getBookingDetails(slotId),
      getOwnerNotificationEmail(),
    ]);

    if (!details || !email) return;

    await sendEmail(
      email,
      `New booking: ${details.clientName}`,
      buildEmailHtml(details)
    );
  } catch {
    // Booking should succeed even if email fails
  }
}

export function isOwnerNotificationConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
