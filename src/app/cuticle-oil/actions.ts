"use server";

import { revalidatePath } from "next/cache";

import { getOwnerSession } from "@/lib/auth";
import { CUTICLE_OIL_LIMITS, isValidOrderUrl } from "@/lib/cuticle-oil-limits";
import { createClient } from "@/lib/supabase/server";

export type CuticleOilActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const OWNER_ONLY = { error: "Only the owner can edit the cuticle oil page." };

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function done(message?: string): CuticleOilActionState {
  revalidatePath("/cuticle-oil");
  return { success: true, message };
}

/** Table writes are owner-only via RLS (migration 017); this is the friendly check. */
function failed(error: { message: string; code?: string }): CuticleOilActionState {
  if (error.code === "PGRST205" || error.code === "42P01") {
    return { error: "The cuticle oil page needs database migration 017." };
  }
  return { error: error.message };
}

/** New scents go to the end of the list. */
async function nextScentSortOrder(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cuticle_oil_scents")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}

export async function addCuticleOilScent(
  _prev: CuticleOilActionState | null,
  formData: FormData
): Promise<CuticleOilActionState> {
  if (!(await getOwnerSession())) return OWNER_ONLY;

  const name = text(formData, "name");
  if (!name || name.length > CUTICLE_OIL_LIMITS.scentName) {
    return { error: `Scent names are 1–${CUTICLE_OIL_LIMITS.scentName} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cuticle_oil_scents")
    .insert({ name, sort_order: await nextScentSortOrder() });

  return error ? failed(error) : done(`Added ${name}.`);
}

export async function updateCuticleOilScent(
  _prev: CuticleOilActionState | null,
  formData: FormData
): Promise<CuticleOilActionState> {
  if (!(await getOwnerSession())) return OWNER_ONLY;

  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id) return { error: "Missing scent." };
  if (!name || name.length > CUTICLE_OIL_LIMITS.scentName) {
    return { error: `Scent names are 1–${CUTICLE_OIL_LIMITS.scentName} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cuticle_oil_scents")
    .update({ name, sold_out: formData.get("soldOut") === "on" })
    .eq("id", id);

  return error ? failed(error) : done("Saved");
}

export async function deleteCuticleOilScent(
  _prev: CuticleOilActionState | null,
  formData: FormData
): Promise<CuticleOilActionState> {
  if (!(await getOwnerSession())) return OWNER_ONLY;

  const id = text(formData, "id");
  if (!id) return { error: "Missing scent." };

  const supabase = await createClient();
  const { error } = await supabase.from("cuticle_oil_scents").delete().eq("id", id);

  return error ? failed(error) : done();
}

/** One size, one price for every scent (stored in app_config). */
export async function setCuticleOilPrice(
  _prev: CuticleOilActionState | null,
  formData: FormData
): Promise<CuticleOilActionState> {
  if (!(await getOwnerSession())) return OWNER_ONLY;

  const price = text(formData, "price");
  if (!price || price.length > CUTICLE_OIL_LIMITS.price) {
    return { error: `Price is 1–${CUTICLE_OIL_LIMITS.price} characters.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_config")
    .update({ value: price })
    .eq("key", "cuticle_oil_price")
    .select("key");

  if (error) return failed(error);
  if (!data?.length) {
    return { error: "The price needs database migration 017." };
  }

  return done("Price saved.");
}

/** Empty clears the link, which shows "Ordering opens soon" to visitors. */
export async function setCuticleOilOrderUrl(
  _prev: CuticleOilActionState | null,
  formData: FormData
): Promise<CuticleOilActionState> {
  if (!(await getOwnerSession())) return OWNER_ONLY;

  const url = text(formData, "orderUrl");
  if (url && !isValidOrderUrl(url)) {
    return { error: "Paste the full form link, starting with https://" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_config")
    .update({ value: url })
    .eq("key", "cuticle_oil_order_url")
    .select("key");

  if (error) return failed(error);
  if (!data?.length) {
    return { error: "The order link needs database migration 017." };
  }

  return done(url ? "Order link saved." : "Order link removed.");
}
