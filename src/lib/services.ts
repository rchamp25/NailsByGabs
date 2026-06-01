import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ServiceCategory } from "@/types/services";

export async function getServiceMenu(): Promise<ServiceCategory[]> {
  try {
    const supabase = await createClient();

    const { data: categories, error: catError } = await supabase
      .from("service_categories")
      .select("id, title, sort_order")
      .order("sort_order", { ascending: true });

    if (catError || !categories?.length) {
      return [];
    }

    const { data: items, error: itemError } = await supabase
      .from("service_items")
      .select("id, category_id, name, price, note, sort_order")
      .order("sort_order", { ascending: true });

    if (itemError || !items) {
      return categories.map((c) => ({ ...c, items: [] }));
    }

    return categories.map((category) => ({
      ...category,
      items: items.filter((item) => item.category_id === category.id),
    }));
  } catch {
    return [];
  }
}

export async function isGoogleCalendarConnected(
  ownerId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("owner_integrations")
      .select("google_refresh_token")
      .eq("owner_id", ownerId)
      .maybeSingle();

    return !!data?.google_refresh_token;
  } catch {
    return false;
  }
}

export function isGoogleOAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
