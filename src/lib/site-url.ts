/** Production domain — used in links, emails, and redirects. */
export const CANONICAL_SITE_URL = "https://nailsbygabs.org";

/**
 * Canonical site URL for auth redirects and email confirmation links.
 * Priority: NEXT_PUBLIC_SITE_URL → production domain → preview Vercel URL → localhost.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.VERCEL_ENV === "production") {
    return CANONICAL_SITE_URL;
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}
