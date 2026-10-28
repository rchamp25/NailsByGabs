import "server-only";

import { isValidOrderUrl } from "@/lib/cuticle-oil-limits";
import { createClient } from "@/lib/supabase/server";

export type CuticleOilScent = {
  id: string;
  name: string;
  soldOut: boolean;
};

export type CuticleOilPage = {
  scents: CuticleOilScent[];
  /** One size, same price for every scent (e.g. "$12"). Empty if unset. */
  price: string;
  /** Google Form link; empty until Gabs sets it ("Ordering opens soon"). */
  orderUrl: string;
  /** False until migration 017 is applied. */
  ready: boolean;
};

function isMissingTable(code: string | undefined): boolean {
  return code === "PGRST205" || code === "42P01";
}

/** Scents, price and order link for /cuticle-oil. Never throws. */
export async function getCuticleOilPage(): Promise<CuticleOilPage> {
  const notReady: CuticleOilPage = { scents: [], price: "", orderUrl: "", ready: false };
  try {
    const supabase = await createClient();
    const [scentsResult, configResult] = await Promise.all([
      supabase
        .from("cuticle_oil_scents")
        .select("id, name, sold_out")
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("app_config")
        .select("key, value")
        .in("key", ["cuticle_oil_order_url", "cuticle_oil_price"]),
    ]);

    if (scentsResult.error) {
      if (!isMissingTable(scentsResult.error.code)) {
        console.error("[cuticle-oil] Failed to read:", scentsResult.error.message);
      }
      return notReady;
    }

    const config = new Map(
      (configResult.data ?? []).map((row) => [row.key, String(row.value ?? "").trim()])
    );
    const rawUrl = config.get("cuticle_oil_order_url") ?? "";

    return {
      scents: (scentsResult.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        soldOut: row.sold_out === true,
      })),
      price: config.get("cuticle_oil_price") ?? "",
      orderUrl: isValidOrderUrl(rawUrl) ? rawUrl : "",
      ready: true,
    };
  } catch {
    return notReady;
  }
}
