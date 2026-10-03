import { Instagram, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { ProfileCard } from "@/components/effects/profile-card";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aboutContent } from "@/lib/data";

export default function AboutPage() {
  const { bio, location, social } = aboutContent;

  return (
    <>
      <SiteHeader title="About Gabs" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <ScrollReveal>
            <ProfileCard
              name="Gabrielle"
              subtitle="GelX nails · Rochester & Binghamton"
              imageSrc="/about/HeadshotGabrielle.jpeg"
              imageAlt="Gabrielle from NailsByGabs"
              className="max-h-[520px] lg:max-h-none"
            />
          </ScrollReveal>

          <ScrollReveal>
            <div className="flex flex-col gap-6">
            <div>
              <p className="section-kicker text-sm uppercase tracking-widest text-accent">
                Meet your artist
              </p>
              <h2 className="font-serif mt-1 text-3xl text-primary md:text-5xl">
                Hi, I&apos;m Gabs
              </h2>
            </div>

            <p className="text-muted-foreground rhythm-copy leading-relaxed whitespace-pre-line">
              {bio}
            </p>

            <Card className="spotlight-card border-accent/25 py-4">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {location.address}
                      <br />
                      {location.city}
                    </p>
                  </div>
                </div>

                {location.phone && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <a
                      href={`tel:${location.phone.replace(/\D/g, "")}`}
                      className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                    >
                      <Phone className="size-4 text-accent" />
                      {location.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="text-accent" />
                  Instagram
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-accent font-semibold">♪</span>
                  TikTok
                </Link>
              </Button>
            </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </>
  );
}
