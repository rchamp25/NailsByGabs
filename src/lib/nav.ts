import {
  BarChart3,
  CalendarHeart,
  Crown,
  Droplet,
  Images,
  Palette,
  Sparkles,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Shared by the desktop top bar and the mobile bottom bar. */
export type NavItem = {
  href: string;
  /** Desktop tab text. */
  label: string;
  /** Mobile bottom-bar text (space is tight). */
  short: string;
  icon: LucideIcon;
};

export const PUBLIC_NAV: NavItem[] = [
  { href: "/", label: "Portfolio", short: "Portfolio", icon: Images },
  { href: "/book", label: "Book", short: "Book", icon: CalendarHeart },
  { href: "/services", label: "Services & Pricing", short: "Prices", icon: Sparkles },
  { href: "/cuticle-oil", label: "Cuticle Oil", short: "Oil", icon: Droplet },
  { href: "/about", label: "About", short: "About", icon: UserRound },
];

/** Shown to loyalty members and the owner (see canSeeLoyalty). */
export const LOYALTY_NAV: NavItem = {
  href: "/loyalty",
  label: "Loyalty",
  short: "Loyalty",
  icon: Crown,
};

/** Shown only to the owner, after the public items (folded into one "Owner" menu on narrow screens). */
export const OWNER_NAV: NavItem[] = [
  { href: "/analytics", label: "Stats", short: "Stats", icon: BarChart3 },
  { href: "/clients", label: "Clients", short: "Clients", icon: Users },
  { href: "/photos", label: "Photos", short: "Photos", icon: Tags },
  { href: "/settings", label: "Theme", short: "Theme", icon: Palette },
];

/** What the owner's folded "Owner" menu lists. */
export const OWNER_MENU_NAV: NavItem[] = [LOYALTY_NAV, ...OWNER_NAV];

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
