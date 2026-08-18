"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth";
import {
  deleteGoogleCalendarEvent,
  syncSlotToGoogleCalendar,
} from "@/lib/google-calendar";
import { parseBusinessDateTimeLocal } from "@/lib/business-timezone";
import { isAppointmentLocation } from "@/lib/appointment-locations";
import {
  notifyClientOfBooking,
  notifyOwnerOfBooking,
  notifyOwnerOfCancellation,
  readBookingNotificationDetails,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

async function getOwnerProfileId(): Promise<string | null> {
  const supabase = await createClient();
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
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "owner") {
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

export async function deleteSlot(slotId: string) {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can delete slots." };
  }

  if (profile.id) {
    await deleteGoogleCalendarEvent(slotId, profile.id);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointment_slots")
    .delete()
    .eq("id", slotId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/book");
  return { success: true };
}

export async function releaseSlot(slotId: string) {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can release bookings." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointment_slots")
    .update({ status: "open", booked_by: null, booked_name: null, notes: null })
    .eq("id", slotId);

  if (error) {
    return { error: error.message };
  }

  await syncGoogleForSlot(slotId);

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

  await notifyOwnerOfCancellation(details);
  await syncGoogleForSlot(slotId);

  revalidatePath("/book");
  return { success: true };
}
