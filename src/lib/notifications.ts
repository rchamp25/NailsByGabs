import "server-only";

import { getLocationShortLabel, normalizeAppointmentLocation } from "@/lib/appointment-locations";
import { formatOwnerSlotLabel } from "@/lib/booking-display";
import { formatSlotRange } from "@/lib/dates";
import { getOwnerNotificationEmail } from "@/lib/owner-contact";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

type BookingNotificationDetails = {
  /** Owner-facing label (e.g. "Jane's Nails"). */
  clientName: string;
  /** Raw profile name for client-facing emails. */
  bookerFullName: string;
  timeRange: string;
  locationLabel: string;
  notes: string | null;
};

export type { BookingNotificationDetails };

/** Load slot details before cancel_my_booking clears booked_by and notes. */
export async function readBookingNotificationDetails(
  slotId: string
): Promise<BookingNotificationDetails | null> {
  return getBookingDetails(slotId);
}

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
      location,
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
    bookerFullName: booker?.full_name?.trim() || "Client",
    timeRange: formatSlotRange(data.start_at, data.end_at),
    locationLabel: getLocationShortLabel(
      normalizeAppointmentLocation(data.location as string | null)
    ),
    notes: data.notes,
  };
}

function buildOwnerEmailHtml(details: BookingNotificationDetails): string {
  const siteUrl = getSiteUrl();
  return `
    <div style="font-family:Georgia,serif;color:#3d1f2a;max-width:480px">
      <h2 style="color:#c62828">New appointment booked</h2>
      <p><strong>${details.clientName}</strong> just reserved a slot on NailsByGabs.</p>
      <p><strong>When:</strong> ${details.timeRange}</p>
      <p><strong>Location:</strong> ${details.locationLabel}</p>
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

function buildOwnerCancellationHtml(details: BookingNotificationDetails): string {
  const siteUrl = getSiteUrl();
  return `
    <div style="font-family:Georgia,serif;color:#3d1f2a;max-width:480px">
      <h2 style="color:#c62828">Booking cancelled</h2>
      <p><strong>${details.clientName}</strong> cancelled their appointment on NailsByGabs.</p>
      <p><strong>Was scheduled for:</strong> ${details.timeRange}</p>
      <p><strong>Location:</strong> ${details.locationLabel}</p>
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

function clientGreetingName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function buildClientConfirmationHtml(
  details: BookingNotificationDetails
): string {
  const siteUrl = getSiteUrl();
  const greeting = clientGreetingName(details.bookerFullName);
  return `
    <div style="font-family:Georgia,serif;color:#3d1f2a;max-width:480px">
      <h2 style="color:#c62828">You&apos;re booked!</h2>
      <p>Hi ${greeting},</p>
      <p>Your appointment at <strong>NailsByGabs</strong> is confirmed.</p>
      <p><strong>When:</strong> ${details.timeRange}</p>
      <p><strong>Location:</strong> ${details.locationLabel}</p>
      ${
        details.notes
          ? `<p><strong>Your notes:</strong> ${details.notes}</p>`
          : ""
      }
      <p style="margin-top:24px">
        <a href="${siteUrl}/book" style="background:#c62828;color:#fff8fa;padding:12px 20px;border-radius:8px;text-decoration:none;border:1px solid #c9a227">
          View or manage booking
        </a>
      </p>
      <p style="margin-top:24px;font-size:14px;color:#6b4a55">
        Need to change plans? Sign in on the site and cancel from your booking on the calendar.
      </p>
    </div>
  `;
}

function buildClientReminderHtml(details: BookingNotificationDetails): string {
  const siteUrl = getSiteUrl();
  const greeting = clientGreetingName(details.bookerFullName);
  return `
    <div style="font-family:Georgia,serif;color:#3d1f2a;max-width:480px">
      <h2 style="color:#c62828">Appointment reminder</h2>
      <p>Hi ${greeting},</p>
      <p>This is a friendly reminder that your <strong>NailsByGabs</strong> appointment is coming up in about 48 hours.</p>
      <p><strong>When:</strong> ${details.timeRange}</p>
      <p><strong>Location:</strong> ${details.locationLabel}</p>
      ${
        details.notes
          ? `<p><strong>Your notes:</strong> ${details.notes}</p>`
          : ""
      }
      <p style="margin-top:24px">
        <a href="${siteUrl}/book" style="background:#c62828;color:#fff8fa;padding:12px 20px;border-radius:8px;text-decoration:none;border:1px solid #c9a227">
          View or manage booking
        </a>
      </p>
      <p style="margin-top:24px;font-size:14px;color:#6b4a55">
        Need to reschedule? Sign in on the site and cancel from your booking on the calendar.
      </p>
    </div>
  `;
}

function isValidRecipientEmail(email: string | undefined | null): email is string {
  const trimmed = email?.trim();
  return !!trimmed && trimmed.includes("@");
}

const DEFAULT_FROM = "NailsByGabs <onboarding@resend.dev>";

/** Vercel env values with accidental newlines break Resend (e.g. `onboarding@` + newline + `>`). */
function getResendFromAddress(): string {
  const raw = process.env.RESEND_FROM_EMAIL;
  if (!raw?.trim()) return DEFAULT_FROM;

  const sanitized = raw.replace(/[\r\n]+/g, "").replace(/\s+/g, " ").trim();
  const hasValidMailbox =
    sanitized.includes("@") &&
    !sanitized.endsWith("@") &&
    !sanitized.includes("<@") &&
    !sanitized.includes("@>");

  if (!hasValidMailbox) {
    console.error(
      "[notifications] Invalid RESEND_FROM_EMAIL; using default. Got:",
      JSON.stringify(raw)
    );
    return DEFAULT_FROM;
  }

  return sanitized;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[notifications] RESEND_API_KEY is not set");
    return false;
  }

  const from = getResendFromAddress();

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

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      "[notifications] Resend failed:",
      response.status,
      "to=",
      to,
      "from=",
      from,
      body
    );
  }

  return response.ok;
}

/** Email Gabs when a client books. Free via Resend (3,000 emails/mo). Never throws. */
export async function notifyOwnerOfBooking(slotId: string): Promise<void> {
  try {
    const [details, email] = await Promise.all([
      getBookingDetails(slotId),
      getOwnerNotificationEmail(),
    ]);

    if (!details || !email) {
      console.error(
        "[notifications] Skipped: missing booking details or owner email"
      );
      return;
    }

    await sendEmail(
      email,
      `New booking: ${details.clientName}`,
      buildOwnerEmailHtml(details)
    );
  } catch {
    // Booking should succeed even if email fails
  }
}

/** Confirmation email to the client who booked. Uses the same Resend setup. Never throws. */
export async function notifyClientOfBooking(
  slotId: string,
  clientEmail: string | undefined
): Promise<void> {
  try {
    if (!isValidRecipientEmail(clientEmail)) {
      console.error(
        "[notifications] Skipped client confirmation: no valid client email"
      );
      return;
    }

    const details = await getBookingDetails(slotId);
    if (!details) {
      console.error(
        "[notifications] Skipped client confirmation: missing booking details"
      );
      return;
    }

    await sendEmail(
      clientEmail,
      `Appointment confirmed — ${details.timeRange}`,
      buildClientConfirmationHtml(details)
    );
  } catch {
    // Booking should succeed even if email fails
  }
}

/** 48-hour reminder email to the booked client. Returns whether Resend accepted the send. */
export async function notifyClientOfAppointmentReminder(
  details: BookingNotificationDetails,
  clientEmail: string | undefined
): Promise<boolean> {
  try {
    if (!isValidRecipientEmail(clientEmail)) {
      console.error(
        "[notifications] Skipped appointment reminder: no valid client email"
      );
      return false;
    }

    return sendEmail(
      clientEmail,
      `Reminder: appointment in 2 days — ${details.timeRange}`,
      buildClientReminderHtml(details)
    );
  } catch {
    return false;
  }
}

/** Email Gabs when a client cancels. Never throws. */
export async function notifyOwnerOfCancellation(
  details: BookingNotificationDetails | null
): Promise<void> {
  try {
    if (!details) {
      console.error(
        "[notifications] Skipped cancellation alert: missing booking details"
      );
      return;
    }

    const email = await getOwnerNotificationEmail();
    if (!email) {
      console.error(
        "[notifications] Skipped cancellation alert: missing owner email"
      );
      return;
    }

    await sendEmail(
      email,
      `Booking cancelled: ${details.clientName}`,
      buildOwnerCancellationHtml(details)
    );
  } catch {
    // Cancellation should succeed even if email fails
  }
}

export function isOwnerNotificationConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
