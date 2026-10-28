import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Cake, CalendarHeart, Crown, Ticket, type LucideIcon } from "lucide-react";

import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { canSeeLoyalty, getSessionProfile } from "@/lib/auth";

function formatMemberSince(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

/** The program as Gabs described it (2026-10-27). Fixed text; edit here to change it. */
const PERKS: { icon: LucideIcon; title: string; body: string[] }[] = [
  {
    icon: Ticket,
    title: "Punch card",
    body: [
      "Gabs gives you a physical punch card. You earn a punch at each appointment.",
      "Every 9th punch gets you 15% off that set.",
    ],
  },
  {
    icon: Cake,
    title: "Birthday discount",
    body: [
      "Turning 20? Get 20% off a set.",
      "Gabs sends your birthday coupon by Instagram DM. It expires 6 months after your birthday.",
    ],
  },
  {
    icon: CalendarHeart,
    title: "Booking priority",
    body: [
      "Some open times on the booking calendar are marked Members only. They're reserved for loyalty members.",
      "They open to everyone 24 hours before the appointment, so book early.",
    ],
  },
];

/** Lets the perk cards in a row match heights (ScrollReveal wraps each in an inner div). */
const revealFill = "h-full [&>.scroll-reveal-inner]:h-full";

/** Members-only page (the owner can always see it). Everyone else goes home. */
export default async function LoyaltyPage() {
  const { profile } = await getSessionProfile();
  if (!profile || !canSeeLoyalty(profile)) {
    redirect("/");
  }

  const isOwner = profile.role === "owner";
  const firstName = profile.full_name.trim().split(/\s+/)[0] || "there";
  const memberSince = formatMemberSince(profile.loyalty_member_since);

  return (
    <>
      <SiteHeader title="Loyalty" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <ScrollReveal>
          <div className="mx-auto w-full max-w-4xl text-center">
            <p className="section-kicker text-sm uppercase tracking-widest text-accent">
              Members only
            </p>
            <h2 className="font-serif mt-1 text-3xl text-primary md:text-5xl">
              {isOwner ? "Loyalty program" : `Welcome, ${firstName}`}
            </h2>
            <p className="text-muted-foreground rhythm-copy mx-auto mt-3 text-sm leading-relaxed md:text-base">
              {isOwner
                ? "Only clients you mark as loyalty members (on the Clients page) can see this page."
                : "Thank you for being a NailsByGabs regular. Here's what you get as a loyalty member."}
            </p>
            {memberSince && !isOwner && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary">
                <Crown className="size-4 text-accent" aria-hidden />
                Member since {memberSince}
              </p>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          {/* Gabs's design of the physical punch card. Mostly text, so it is
              shown near its native 600px width at high quality. */}
          <Image
            src="/loyalty/LoyaltyPunchCard.webp"
            alt="NailsByGabs loyalty punch card: You're so loyal! Get 15% off on your 9th appointment. Eight numbered punch spots, then a ninth spot marked 15% off."
            width={600}
            height={1050}
            sizes="(min-width: 640px) 320px, 80vw"
            quality={90}
            className="mx-auto h-auto w-full max-w-[80vw] rounded-2xl border border-accent/25 shadow-sm sm:max-w-xs"
          />
        </ScrollReveal>

        <ul className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-3">
          {PERKS.map((perk) => (
            <li key={perk.title}>
              <ScrollReveal className={revealFill}>
                <section className="h-full rounded-2xl border border-accent/25 bg-card/90 p-5 shadow-sm backdrop-blur-sm md:p-6">
                  <div className="flex items-center gap-3 border-b border-accent/30 pb-3">
                    <perk.icon className="size-6 shrink-0 text-accent" aria-hidden />
                    <h3 className="font-serif text-2xl text-primary">{perk.title}</h3>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-relaxed">
                    {perk.body.map((line, index) => (
                      <p
                        key={line}
                        className={index === 0 ? "text-foreground" : "text-muted-foreground"}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            </li>
          ))}
        </ul>

        {!isOwner && (
          <div className="mx-auto">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/book">See open times</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
