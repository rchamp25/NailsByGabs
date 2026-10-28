import "server-only";

import { getLocationShortLabel, normalizeAppointmentLocation } from "@/lib/appointment-locations";
import { formatOwnerSlotLabel } from "@/lib/booking-display";
import { formatSlotRange } from "@/lib/dates";
import { getOwnerNotificationEmail } from "@/lib/owner-contact";
import { getSiteUrl } from "@/lib/site-url";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getActiveThemeId } from "@/lib/theme";
import { getThemeMeta, type EmailPalette } from "@/lib/themes";

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

/** Client names and notes are user input; escape everything interpolated into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Colors of the owner-selected site theme, so emails match the website. */
async function getEmailPalette(): Promise<EmailPalette> {
  return getThemeMeta(await getActiveThemeId()).email;
}

function buildEmailHtml(
  palette: EmailPalette,
  {
    heading,
    body,
    ctaLabel,
    ctaPath = "/book",
    footer,
  }: {
    heading: string;
    body: string;
    ctaLabel: string;
    /** Site path the button opens. */
    ctaPath?: string;
    footer?: string;
  }
): string {
  const siteUrl = getSiteUrl();
  return `
    <div style="font-family:Georgia,serif;color:${palette.text};background:${palette.background};max-width:480px;padding:24px;border-radius:12px;border:1px solid ${palette.accent}">
      <h2 style="color:${palette.primary};margin-top:0">${heading}</h2>
      ${body}
      <p style="margin-top:24px">
        <a href="${siteUrl}${ctaPath}" style="background:${palette.primary};color:${palette.primaryText};padding:12px 20px;border-radius:8px;text-decoration:none;border:1px solid ${palette.accent}">
          ${ctaLabel}
        </a>
      </p>
      ${
        footer
          ? `<p style="margin-top:24px;margin-bottom:0;font-size:14px;color:${palette.muted}">${footer}</p>`
          : ""
      }
    </div>
  `;
}

function appointmentDetailsHtml(
  details: BookingNotificationDetails,
  { whenLabel, notesLabel }: { whenLabel: string; notesLabel: string }
): string {
  return `
      <p><strong>${whenLabel}:</strong> ${escapeHtml(details.timeRange)}</p>
      <p><strong>Location:</strong> ${escapeHtml(details.locationLabel)}</p>
      ${
        details.notes
          ? `<p><strong>${notesLabel}:</strong> ${escapeHtml(details.notes)}</p>`
          : ""
      }`;
}

function buildOwnerEmailHtml(
  details: BookingNotificationDetails,
  palette: EmailPalette
): string {
  return buildEmailHtml(palette, {
    heading: "New appointment booked",
    body: `
      <p><strong>${escapeHtml(details.clientName)}</strong> just reserved a slot on NailsByGabs.</p>
      ${appointmentDetailsHtml(details, { whenLabel: "When", notesLabel: "Client notes" })}`,
    ctaLabel: "View calendar",
  });
}

function buildOwnerCancellationHtml(
  details: BookingNotificationDetails,
  palette: EmailPalette
): string {
  return buildEmailHtml(palette, {
    heading: "Booking cancelled",
    body: `
      <p><strong>${escapeHtml(details.clientName)}</strong> cancelled their appointment on NailsByGabs.</p>
      ${appointmentDetailsHtml(details, { whenLabel: "Was scheduled for", notesLabel: "Client notes" })}`,
    ctaLabel: "View calendar",
  });
}

function clientGreetingName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function buildClientConfirmationHtml(
  details: BookingNotificationDetails,
  palette: EmailPalette
): string {
  const greeting = escapeHtml(clientGreetingName(details.bookerFullName));
  return buildEmailHtml(palette, {
    heading: "You&apos;re booked!",
    body: `
      <p>Hi ${greeting},</p>
      <p>Your appointment at <strong>NailsByGabs</strong> is confirmed.</p>
      ${appointmentDetailsHtml(details, { whenLabel: "When", notesLabel: "Your notes" })}`,
    ctaLabel: "View or manage booking",
    footer:
      "Need to change plans? Sign in on the site and cancel from your booking on the calendar.",
  });
}

function buildClientReminderHtml(
  details: BookingNotificationDetails,
  palette: EmailPalette
): string {
  const greeting = escapeHtml(clientGreetingName(details.bookerFullName));
  return buildEmailHtml(palette, {
    heading: "Appointment reminder",
    body: `
      <p>Hi ${greeting},</p>
      <p>This is a friendly reminder that your <strong>NailsByGabs</strong> appointment is coming up in about 48 hours.</p>
      ${appointmentDetailsHtml(details, { whenLabel: "When", notesLabel: "Your notes" })}`,
    ctaLabel: "View or manage booking",
    footer:
      "Need to reschedule? Sign in on the site and cancel from your booking on the calendar.",
  });
}

function buildLoyaltyWelcomeHtml(fullName: string, palette: EmailPalette): string {
  const greeting = escapeHtml(clientGreetingName(fullName));
  return buildEmailHtml(palette, {
    heading: "Welcome to the loyalty program!",
    body: `
      <p>Hi ${greeting},</p>
      <p>Gabs added you to the <strong>NailsByGabs</strong> loyalty program. Thank you for being such a regular!</p>
      <p style="margin-bottom:4px"><strong>Your perks:</strong></p>
      <ul style="margin-top:0;padding-left:20px">
        <li>A punch card: every 9th punch is 15% off that set</li>
        <li>Turning 20? 20% off a set (Gabs sends the coupon by Instagram DM)</li>
        <li>Members-only appointment times on the booking calendar</li>
      </ul>
      <p>Sign in on the site and open the <strong>Loyalty</strong> tab for the details.</p>`,
    ctaLabel: "See your perks",
    ctaPath: "/loyalty",
  });
}

/** Gabs's optional note, escaped, with line breaks kept. */
function ownerMessageHtml(message: string | null, palette: EmailPalette): string {
  if (!message) return "";
  return `
      <p style="margin-bottom:4px"><strong>Message from Gabs:</strong></p>
      <p style="margin-top:0;padding:12px 16px;border-left:3px solid ${palette.accent};font-style:italic">${escapeHtml(message).replace(/\r?\n/g, "<br>")}</p>`;
}

function buildClientCancellationHtml(
  details: BookingNotificationDetails,
  palette: EmailPalette
): string {
  const greeting = escapeHtml(clientGreetingName(details.bookerFullName));
  return buildEmailHtml(palette, {
    heading: "Appointment cancelled",
    body: `
      <p>Hi ${greeting},</p>
      <p>Your <strong>NailsByGabs</strong> appointment has been cancelled, as you requested.</p>
      ${appointmentDetailsHtml({ ...details, notes: null }, { whenLabel: "Was scheduled for", notesLabel: "" })}`,
    ctaLabel: "Book a new time",
    footer: "Changed your mind? Open times are always on the booking page.",
  });
}

function buildClientDroppedHtml(
  details: BookingNotificationDetails,
  message: string | null,
  palette: EmailPalette
): string {
  const greeting = escapeHtml(clientGreetingName(details.bookerFullName));
  return buildEmailHtml(palette, {
    heading: "Gabs dropped your appointment",
    body: `
      <p>Hi ${greeting},</p>
      <p>Gabs had to cancel your <strong>NailsByGabs</strong> appointment. Sorry for the change of plans!</p>
      ${appointmentDetailsHtml({ ...details, notes: null }, { whenLabel: "Was scheduled for", notesLabel: "" })}
      ${ownerMessageHtml(message, palette)}`,
    ctaLabel: "Book a new time",
    footer: "Pick another open time on the booking page whenever you're ready.",
  });
}

function buildClientUpdatedHtml(
  before: BookingNotificationDetails,
  after: BookingNotificationDetails,
  message: string | null,
  palette: EmailPalette
): string {
  const greeting = escapeHtml(clientGreetingName(before.bookerFullName));
  const previous = [
    before.timeRange !== after.timeRange ? escapeHtml(before.timeRange) : null,
    before.locationLabel !== after.locationLabel ? escapeHtml(before.locationLabel) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return buildEmailHtml(palette, {
    heading: "Gabs updated your appointment",
    body: `
      <p>Hi ${greeting},</p>
      <p>Gabs made a change to your <strong>NailsByGabs</strong> appointment. Here are the new details:</p>
      ${appointmentDetailsHtml(after, { whenLabel: "When", notesLabel: "Your notes" })}
      <p style="color:${palette.muted};font-size:14px"><s>Previously: ${previous}</s></p>
      ${ownerMessageHtml(message, palette)}`,
    ctaLabel: "View your booking",
    footer:
      "Can't make the new time? Sign in on the site and cancel from your booking on the calendar.",
  });
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

/**
 * Local development only: deliver to the Mailpit inbox that `supabase start`
 * runs (web UI on :54324) through its send API, instead of Resend.
 */
async function sendViaMailpit(
  baseUrl: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const from = getResendFromAddress();
  const match = /^(.*)<([^>]+)>\s*$/.exec(from);
  const sender = match
    ? { Name: match[1].trim(), Email: match[2].trim() }
    : { Name: "", Email: from };

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: sender,
      To: [{ Email: to }],
      Subject: subject,
      HTML: html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("[notifications] Mailpit send failed:", response.status, body);
  }

  return response.ok;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const mailpitUrl =
    process.env.NODE_ENV !== "production"
      ? process.env.DEV_MAILPIT_URL?.trim()
      : undefined;
  if (mailpitUrl) {
    return sendViaMailpit(mailpitUrl, to, subject, html);
  }

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
    const [details, email, palette] = await Promise.all([
      getBookingDetails(slotId),
      getOwnerNotificationEmail(),
      getEmailPalette(),
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
      buildOwnerEmailHtml(details, palette)
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

    const [details, palette] = await Promise.all([
      getBookingDetails(slotId),
      getEmailPalette(),
    ]);
    if (!details) {
      console.error(
        "[notifications] Skipped client confirmation: missing booking details"
      );
      return;
    }

    await sendEmail(
      clientEmail,
      `Appointment confirmed — ${details.timeRange}`,
      buildClientConfirmationHtml(details, palette)
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
      buildClientReminderHtml(details, await getEmailPalette())
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

    const [email, palette] = await Promise.all([
      getOwnerNotificationEmail(),
      getEmailPalette(),
    ]);
    if (!email) {
      console.error(
        "[notifications] Skipped cancellation alert: missing owner email"
      );
      return;
    }

    await sendEmail(
      email,
      `Booking cancelled: ${details.clientName}`,
      buildOwnerCancellationHtml(details, palette)
    );
  } catch {
    // Cancellation should succeed even if email fails
  }
}

/** Upcoming platform booking plus the client's email, read before Gabs changes it. */
export type ClientBookingSnapshot = {
  email: string;
  startAt: string;
  endAt: string;
  location: string | null;
  details: BookingNotificationDetails;
};

/**
 * Snapshot of a client's booking for emails that Gabs's actions trigger.
 * Null for manual bookings (no client account), appointments that have
 * already ended, or when the client's email can't be read. Uses the service
 * role because the client's email lives in auth.users. Never throws.
 */
export async function readUpcomingClientBooking(
  slotId: string
): Promise<ClientBookingSnapshot | null> {
  try {
    const admin = createServiceRoleClient();
    if (!admin) {
      console.error("[notifications] Client email skipped: SUPABASE_SERVICE_ROLE_KEY is not configured");
      return null;
    }

    const { data } = await admin
      .from("appointment_slots")
      .select("start_at, end_at, location, notes, status, booked_by, booker:profiles!booked_by ( full_name )")
      .eq("id", slotId)
      .maybeSingle();

    if (!data?.booked_by || data.status !== "booked") return null;
    if (new Date(data.end_at).getTime() <= Date.now()) return null;

    const { data: authUser } = await admin.auth.admin.getUserById(data.booked_by);
    const email = authUser?.user?.email;
    if (!isValidRecipientEmail(email)) return null;

    const bookerRaw = data.booker as { full_name: string } | { full_name: string }[] | null;
    const booker = Array.isArray(bookerRaw) ? bookerRaw[0] : bookerRaw;
    const bookerFullName = booker?.full_name?.trim() || "Client";

    return {
      email,
      startAt: data.start_at,
      endAt: data.end_at,
      location: data.location,
      details: {
        clientName: formatOwnerSlotLabel(bookerFullName),
        bookerFullName,
        timeRange: formatSlotRange(data.start_at, data.end_at),
        locationLabel: getLocationShortLabel(normalizeAppointmentLocation(data.location)),
        notes: data.notes,
      },
    };
  } catch {
    return null;
  }
}

/** Confirmation to a client who cancelled their own booking. Never throws. */
export async function notifyClientOfCancellation(
  details: BookingNotificationDetails | null,
  clientEmail: string | undefined
): Promise<void> {
  try {
    if (!details || !isValidRecipientEmail(clientEmail)) {
      console.error("[notifications] Skipped client cancellation: missing details or email");
      return;
    }
    await sendEmail(
      clientEmail,
      `Your appointment is cancelled — ${details.timeRange}`,
      buildClientCancellationHtml(details, await getEmailPalette())
    );
  } catch {
    // Cancellation should succeed even if email fails
  }
}

/** "Gabs dropped your appointment" after a release or delete. Never throws. */
export async function notifyClientOfDroppedAppointment(
  snapshot: ClientBookingSnapshot | null,
  message: string | null
): Promise<void> {
  try {
    if (!snapshot) return;
    await sendEmail(
      snapshot.email,
      "Gabs dropped your appointment",
      buildClientDroppedHtml(snapshot.details, message, await getEmailPalette())
    );
  } catch {
    // The release/delete should succeed even if email fails
  }
}

/**
 * "Gabs updated your appointment" when the time or location changed.
 * `before` is the snapshot taken before saving. Never throws.
 */
export async function notifyClientOfUpdatedAppointment(
  before: ClientBookingSnapshot | null,
  after: { startAt: string; endAt: string; location: string },
  message: string | null
): Promise<void> {
  try {
    if (!before) return;
    const afterDetails: BookingNotificationDetails = {
      ...before.details,
      timeRange: formatSlotRange(after.startAt, after.endAt),
      locationLabel: getLocationShortLabel(normalizeAppointmentLocation(after.location)),
    };
    await sendEmail(
      before.email,
      "Gabs updated your appointment",
      buildClientUpdatedHtml(before.details, afterDetails, message, await getEmailPalette())
    );
  } catch {
    // The edit should succeed even if email fails
  }
}

/**
 * Welcome email when Gabs makes a client a loyalty member. Uses the service
 * role because the client's email lives in auth.users. Never throws.
 */
export async function notifyClientOfLoyaltyMembership(clientId: string): Promise<void> {
  try {
    const admin = createServiceRoleClient();
    if (!admin) {
      console.error("[notifications] Loyalty email skipped: SUPABASE_SERVICE_ROLE_KEY is not configured");
      return;
    }

    const [{ data: authUser }, { data: profile }, palette] = await Promise.all([
      admin.auth.admin.getUserById(clientId),
      admin.from("profiles").select("full_name").eq("id", clientId).maybeSingle(),
      getEmailPalette(),
    ]);
    const email = authUser?.user?.email;
    if (!isValidRecipientEmail(email)) {
      console.error("[notifications] Loyalty email skipped: no valid client email");
      return;
    }

    await sendEmail(
      email,
      "You're a NailsByGabs loyalty member!",
      buildLoyaltyWelcomeHtml(profile?.full_name ?? "", palette)
    );
  } catch {
    // The membership change should succeed even if email fails
  }
}

export function isOwnerNotificationConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
