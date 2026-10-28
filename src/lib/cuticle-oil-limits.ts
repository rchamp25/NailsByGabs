/** Limits shared by the owner editor, the server actions and migration 017's checks. */
export const CUTICLE_OIL_LIMITS = {
  scentName: 40,
  price: 20,
  orderUrl: 500,
} as const;

/** The only size sold; shown next to the price. */
export const CUTICLE_OIL_SIZE = "30 ml bottle";

/** Only https links are stored or rendered (the database enforces the same). */
export function isValidOrderUrl(value: string): boolean {
  if (value.length > CUTICLE_OIL_LIMITS.orderUrl) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
