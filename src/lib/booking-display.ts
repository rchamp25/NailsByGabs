/** Client-safe helpers (no server-only imports). */

export function formatOwnerSlotLabel(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Client appointment";
  if (trimmed.toLowerCase().endsWith("nails")) return trimmed;
  return `${trimmed}'s Nails`;
}
