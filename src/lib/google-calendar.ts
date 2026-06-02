import "server-only";

import { toGoogleCalendarDateTime } from "@/lib/business-timezone";
import { formatOwnerSlotLabel } from "@/lib/booking-display";
import { getSiteUrl } from "@/lib/site-url";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getGoogleRedirectUri(): string {
  return `${getSiteUrl()}/api/google/callback`;
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars";

function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function getSyncSupabase() {
  return createServiceRoleClient();
}

async function getOwnerRefreshToken(ownerId: string): Promise<{
  refreshToken: string;
  calendarId: string;
} | null> {
  const supabase = getSyncSupabase();
  if (!supabase) {
    console.error(
      "[google-calendar] SUPABASE_SERVICE_ROLE_KEY is not set; cannot sync when clients book."
    );
    return null;
  }

  const { data } = await supabase
    .from("owner_integrations")
    .select("google_refresh_token, google_calendar_id")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!data?.google_refresh_token) return null;
  return {
    refreshToken: data.google_refresh_token,
    calendarId: data.google_calendar_id || "primary",
  };
}

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const config = getGoogleOAuthConfig();
  if (!config) return null;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return null;
  const json = (await response.json()) as { access_token?: string };
  return json.access_token ?? null;
}

type SlotRow = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  booked_name: string | null;
  notes: string | null;
  google_event_id: string | null;
  booker: { full_name: string } | { full_name: string }[] | null;
};

async function getSlot(slotId: string): Promise<SlotRow | null> {
  const supabase = getSyncSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("appointment_slots")
    .select(
      `
      id,
      start_at,
      end_at,
      status,
      booked_name,
      notes,
      google_event_id,
      booker:profiles!booked_by ( full_name )
    `
    )
    .eq("id", slotId)
    .maybeSingle();

  return data as SlotRow | null;
}

function getEventTitle(slot: SlotRow): string {
  if (slot.status === "open") return "NailsByGabs — Open slot";
  if (slot.booked_name) return formatOwnerSlotLabel(slot.booked_name);
  const bookerRaw = slot.booker;
  const booker = Array.isArray(bookerRaw) ? bookerRaw[0] : bookerRaw;
  return formatOwnerSlotLabel(booker?.full_name ?? "Client");
}

function getEventDescription(slot: SlotRow): string {
  if (slot.status === "booked" && slot.notes) {
    return `Client notes: ${slot.notes}`;
  }
  return "Managed via NailsByGabs booking.";
}

export async function syncSlotToGoogleCalendar(
  slotId: string,
  ownerId: string
): Promise<void> {
  const integration = await getOwnerRefreshToken(ownerId);
  if (!integration) return;

  const accessToken = await getAccessToken(integration.refreshToken);
  if (!accessToken) return;

  const slot = await getSlot(slotId);
  if (!slot) return;

  const supabase = getSyncSupabase();
  if (!supabase) return;

  const body = {
    summary: getEventTitle(slot),
    description: getEventDescription(slot),
    start: toGoogleCalendarDateTime(slot.start_at),
    end: toGoogleCalendarDateTime(slot.end_at),
  };

  const calendarBase = `${GOOGLE_CALENDAR_API}/${encodeURIComponent(integration.calendarId)}/events`;

  if (slot.google_event_id) {
    const patchResponse = await fetch(`${calendarBase}/${slot.google_event_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (patchResponse.ok) {
      return;
    }

    console.error(
      "[google-calendar] PATCH failed:",
      patchResponse.status,
      await patchResponse.text().catch(() => "")
    );

    if (patchResponse.status !== 404) {
      return;
    }
  }

  const response = await fetch(calendarBase, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error(
      "[google-calendar] POST failed:",
      response.status,
      await response.text().catch(() => "")
    );
    return;
  }

  const created = (await response.json()) as { id?: string };
  if (created.id) {
    await supabase
      .from("appointment_slots")
      .update({ google_event_id: created.id })
      .eq("id", slotId);
  }
}

export async function deleteGoogleCalendarEvent(
  slotId: string,
  ownerId: string
): Promise<void> {
  const integration = await getOwnerRefreshToken(ownerId);
  if (!integration) return;

  const slot = await getSlot(slotId);
  if (!slot?.google_event_id) return;

  const accessToken = await getAccessToken(integration.refreshToken);
  if (!accessToken) return;

  const calendarBase = `${GOOGLE_CALENDAR_API}/${encodeURIComponent(integration.calendarId)}/events/${slot.google_event_id}`;

  await fetch(calendarBase, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const supabase = getSyncSupabase();
  if (!supabase) return;

  await supabase
    .from("appointment_slots")
    .update({ google_event_id: null })
    .eq("id", slotId);
}

export async function disconnectOwnerGoogleCalendar(
  ownerId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("owner_integrations")
    .update({
      google_refresh_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", ownerId);

  if (error) {
    return { error: error.message };
  }

  return {};
}

export function getGoogleOAuthUrl(state: string): string | null {
  const config = getGoogleOAuthConfig();
  if (!config) return null;

  const redirectUri = getGoogleRedirectUri();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<string | null> {
  const config = getGoogleOAuthConfig();
  if (!config) return null;

  const redirectUri = getGoogleRedirectUri();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) return null;
  const json = (await response.json()) as { refresh_token?: string };
  return json.refresh_token ?? null;
}
