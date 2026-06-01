"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createSlot(formData: FormData) {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can create slots." };
  }

  const startRaw = String(formData.get("startAt") ?? "");
  const endRaw = String(formData.get("endAt") ?? "");
  const startAt = new Date(startRaw);
  const endAt = new Date(endRaw);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { error: "Invalid date or time." };
  }
  if (endAt <= startAt) {
    return { error: "End time must be after start time." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("appointment_slots").insert({
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    status: "open",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/book");
  return { success: true };
}

export async function deleteSlot(slotId: string) {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can delete slots." };
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
    .update({ status: "open", booked_by: null, notes: null })
    .eq("id", slotId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/book");
  return { success: true };
}

export async function bookSlot(slotId: string, notes: string) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) {
    return { error: "Please sign in to book." };
  }
  if (profile.role === "owner") {
    return { error: "Owner accounts manage slots; use a client account to book." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("book_appointment_slot", {
    p_slot_id: slotId,
    p_notes: notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/book");
  return { success: true };
}

export async function cancelMyBooking(slotId: string) {
  const { user } = await getSessionProfile();
  if (!user) {
    return { error: "Please sign in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_booking", {
    p_slot_id: slotId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/book");
  return { success: true };
}
