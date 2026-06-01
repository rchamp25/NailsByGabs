"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ServicesActionState = {
  error?: string;
  success?: boolean;
};

export async function updateServiceItem(
  _prev: ServicesActionState | null,
  formData: FormData
): Promise<ServicesActionState> {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can edit prices." };
  }

  const id = String(formData.get("itemId") ?? "");
  const price = String(formData.get("price") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!id || !price) {
    return { error: "Price is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("service_items")
    .update({ price, note: note || null })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/services");
  return { success: true };
}
