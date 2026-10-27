"use server";

import { revalidatePath } from "next/cache";

import { getOwnerSession, getSessionProfile } from "@/lib/auth";
import {
  deleteGoogleCalendarEvent,
  syncSlotToGoogleCalendar,
} from "@/lib/google-calendar";
import { parseBusinessDateTimeLocal } from "@/lib/business-timezone";
import { isAppointmentLocation } from "@/lib/appointment-locations";
import {
  notifyClientOfBooking,
  notifyClientOfCancellation,
  notifyClientOfDroppedAppointment,
  notifyClientOfUpdatedAppointment,
  notifyOwnerOfBooking,
  notifyOwnerOfCancellation,
  readBookingNotificationDetails,
  readUpcomingClientBooking,
} from "@/lib/notifications";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CLIENT_MESSAGE_MAX_LENGTH = 500;

/** Gabs's optional note for the client's email; empty means none. */
function normalizeClientMessage(raw: unknown): string | null {
  const message = String(raw ?? "").trim().slice(0, CLIENT_MESSAGE_MAX_LENGTH);
  return message || null;
}

async function getOwnerProfileId(): Promise<string | null> {
  // Clients cannot read the owner's profile under RLS; Google sync needs the
  // service role anyway, so skip sync when it is not configured.
  const supabase = createServiceRoleClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function syncGoogleForSlot(slotId: string) {
  const ownerId = await getOwnerProfileId();
  if (!ownerId) return;
  await syncSlotToGoogleCalendar(slotId, ownerId);
}

export async function createSlot(formData: FormData) {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can create slots." };
  }

  const startRaw = String(formData.get("startAt") ?? "");
  const endRaw = String(formData.get("endAt") ?? "");
  const preBooked = String(formData.get("preBooked") ?? "") === "on";
  const bookedName = String(formData.get("bookedName") ?? "").trim();
  const locationRaw = String(formData.get("location") ?? "").trim();
  const startAt = parseBusinessDateTimeLocal(startRaw);
  const endAt = parseBusinessDateTimeLocal(endRaw);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { error: "Invalid date or time." };
  }
  if (endAt <= startAt) {
    return { error: "End time must be after start time." };
  }
  if (preBooked && !bookedName) {
    return { error: "Enter a client name for pre-booked slots." };
  }
  if (!isAppointmentLocation(locationRaw)) {
    return { error: "Select a location (Webster or Binghamton)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_slots")
    .insert({
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      location: locationRaw,
      status: preBooked ? "booked" : "open",
      booked_by: null,
      booked_name: preBooked ? bookedName : null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (data?.id) {
    await syncGoogleForSlot(data.id);
  }

  revalidatePath("/book");
  return { success: true };
}

export async function updateSlot(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can edit slots." };
  }

  const slotId = String(formData.get("slotId") ?? "").trim();
  const startRaw = String(formData.get("startAt") ?? "");
  const endRaw = String(formData.get("endAt") ?? "");
  const locationRaw = String(formData.get("location") ?? "").trim();
  const bookedName = String(formData.get("bookedName") ?? "").trim();
  const startAt = parseBusinessDateTimeLocal(startRaw);
  const endAt = parseBusinessDateTimeLocal(endRaw);

  if (!slotId) {
    return { error: "Missing appointment." };
  }
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { error: "Invalid date or time." };
  }
  if (endAt <= startAt) {
    return { error: "End time must be after start time." };
  }
  if (!isAppointmentLocation(locationRaw)) {
    return { error: "Select a location (Webster or Binghamton)." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("appointment_slots")
    .select("id, status, start_at, end_at, location, booked_by")
    .eq("id", slotId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }
  if (!existing) {
    return { error: "Appointment not found." };
  }

  if (existing.status === "booked" && !bookedName) {
    return { error: "Enter a client name for booked appointments." };
  }

  const timeChanged =
    new Date(existing.start_at).getTime() !== startAt.getTime() ||
    new Date(existing.end_at).getTime() !== endAt.getTime();
  const locationChanged = existing.location !== locationRaw;
  // Only time/location changes matter to the client; Gabs's calendar label doesn't.
  const clientSnapshot =
    existing.status === "booked" && existing.booked_by && (timeChanged || locationChanged)
      ? await readUpcomingClientBooking(slotId)
      : null;

  const { error } = await supabase
    .from("appointment_slots")
    .update({
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      location: locationRaw,
      booked_name: existing.status === "booked" ? bookedName : null,
      // A new time gets a fresh 48-hour reminder from the daily cron.
      ...(timeChanged ? { reminder_48h_sent_at: null } : {}),
    })
    .eq("id", slotId);

  if (error) {
    return { error: error.message };
  }

  await syncGoogleForSlot(slotId);
  if (clientSnapshot && endAt.getTime() > Date.now()) {
    await notifyClientOfUpdatedAppointment(
      clientSnapshot,
      { startAt: startAt.toISOString(), endAt: endAt.toISOString(), location: locationRaw },
      normalizeClientMessage(formData.get("clientMessage"))
    );
  }

  revalidatePath("/book");
  return { success: true };
}

/** `clientMessage` is Gabs's optional note for the "dropped" email. */
export async function deleteSlot(slotId: string, clientMessage?: string) {
  const owner = await getOwnerSession();
  if (!owner) {
    return { error: "Only the owner can delete slots." };
  }

  // Read the booking before it disappears; null for open/manual/past slots.
  const clientSnapshot = await readUpcomingClientBooking(slotId);

  await deleteGoogleCalendarEvent(slotId, owner.profile.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointment_slots")
    .delete()
    .eq("id", slotId);

  if (error) {
    return { error: error.message };
  }

  await notifyClientOfDroppedAppointment(
    clientSnapshot,
    normalizeClientMessage(clientMessage)
  );

  revalidatePath("/book");
  return { success: true };
}

/** `clientMessage` is Gabs's optional note for the "dropped" email. */
export async function releaseSlot(slotId: string, clientMessage?: string) {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can release bookings." };
  }

  // Read the booking before the RPC clears booked_by.
  const clientSnapshot = await readUpcomingClientBooking(slotId);

  const supabase = await createClient();
  const { error } = await supabase.rpc("release_appointment_slot", {
    p_slot_id: slotId,
  });

  if (error) {
    return { error: error.message };
  }

  await syncGoogleForSlot(slotId);
  await notifyClientOfDroppedAppointment(
    clientSnapshot,
    normalizeClientMessage(clientMessage)
  );

  revalidatePath("/book");
  return { success: true };
}

export async function bookSlot(slotId: string, notes: string) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) {
    return { error: "Please sign in to book." };
  }
  if (profile.role === "owner") {
    return {
      error: "Owner accounts manage slots; use a client account to book.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("book_appointment_slot", {
    p_slot_id: slotId,
    p_notes: notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  await syncGoogleForSlot(slotId);
  await Promise.all([
    notifyOwnerOfBooking(slotId),
    notifyClientOfBooking(slotId, user.email),
  ]);

  revalidatePath("/book");
  return { success: true };
}

export async function cancelMyBooking(slotId: string) {
  const { user } = await getSessionProfile();
  if (!user) {
    return { error: "Please sign in." };
  }

  const supabase = await createClient();
  const details = await readBookingNotificationDetails(slotId);
  const { error } = await supabase.rpc("cancel_my_booking", {
    p_slot_id: slotId,
  });

  if (error) {
    return { error: error.message };
  }

  await Promise.all([
    notifyOwnerOfCancellation(details),
    notifyClientOfCancellation(details, user.email),
  ]);
  await syncGoogleForSlot(slotId);

  revalidatePath("/book");
  return { success: true };
}
