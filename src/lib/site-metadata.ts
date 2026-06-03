import { CANONICAL_SITE_URL } from "@/lib/site-url";

export const SITE_NAME = "NailsByGabs";
export const SITE_TAGLINE = "GelX Nails";
export const SITE_DESCRIPTION =
  "Book GelX nail appointments with Gabs — portfolio, services, pricing, and open time slots in the Rochester area.";

export const defaultOpenGraph = {
  type: "website" as const,
  locale: "en_US",
  url: CANONICAL_SITE_URL,
  siteName: SITE_NAME,
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
};

export const defaultTwitter = {
  card: "summary_large_image" as const,
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
};
