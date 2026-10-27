import {
  BarChart3,
  CalendarHeart,
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
  { href: "/about", label: "About", short: "About", icon: UserRound },
];

/** Shown only to the owner, after the public items. */
export const OWNER_NAV: NavItem[] = [
  { href: "/analytics", label: "Stats", short: "Stats", icon: BarChart3 },
  { href: "/clients", label: "Clients", short: "Clients", icon: Users },
  { href: "/photos", label: "Photos", short: "Photos", icon: Tags },
  { href: "/settings", label: "Theme", short: "Theme", icon: Palette },
];

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
