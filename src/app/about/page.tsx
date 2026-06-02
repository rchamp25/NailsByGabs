import { Instagram, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aboutContent } from "@/lib/data";

export default function AboutPage() {
  const { bio, location, social } = aboutContent;

  return (
    <>
      <SiteHeader title="About Gabs" />
      <div className="main-floral-accent flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-2xl border border-gold/40 shadow-lg lg:max-h-none">
            <Image
              src="/about/HeadshotGabrielle.jpeg"
              alt="Gabrielle from NailsByGabs"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
              priority
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="section-kicker text-sm uppercase tracking-widest text-gold">
                Meet your artist
              </p>
              <h2 className="font-serif mt-1 text-3xl text-rose-red md:text-5xl">
                Hi, I&apos;m Gabs
              </h2>
            </div>

            <p className="text-muted-foreground rhythm-copy leading-relaxed whitespace-pre-line">
              {bio}
            </p>

            <Card className="border-gold/25 py-4">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {location.address}
                      <br />
                      {location.city}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <a
                    href={`tel:${location.phone.replace(/\D/g, "")}`}
                    className="text-muted-foreground hover:text-rose-red flex items-center gap-2 transition-colors"
                  >
                    <Phone className="size-4 text-gold" />
                    {location.phone}
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="text-gold" />
                  Instagram
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-gold font-semibold">♪</span>
                  TikTok
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
