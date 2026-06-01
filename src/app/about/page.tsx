import { Instagram, MapPin, Clock, Mail, Phone } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aboutContent } from "@/lib/data";

export default function AboutPage() {
  const { bio, hours, location, social } = aboutContent;

  return (
    <>
      <SiteHeader title="About Gabs" />
      <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-2xl border border-gold/40 shadow-lg lg:max-h-none">
            <div
              className="absolute inset-0 bg-gradient-to-br from-pastel-pink via-pastel-pink-deep/70 to-rose-red/30"
              aria-hidden
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center">
              <span className="font-serif text-2xl text-rose-red-deep">
                Professional Photo
              </span>
              <span className="text-muted-foreground text-sm">
                Replace with headshot or studio image
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-gold">
                Meet your artist
              </p>
              <h2 className="font-serif mt-1 text-3xl text-rose-red md:text-4xl">
                Hi, I&apos;m Gabs
              </h2>
            </div>

            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {bio}
            </p>

            <Card className="border-gold/25 py-4">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <ul className="text-muted-foreground mt-1 space-y-1 text-sm">
                      {hours.map((h) => (
                        <li key={h.day}>
                          <span className="text-foreground">{h.day}</span>
                          {" — "}
                          {h.time}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

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
                  <a
                    href={`mailto:${location.email}`}
                    className="text-muted-foreground hover:text-rose-red flex items-center gap-2 transition-colors"
                  >
                    <Mail className="size-4 text-gold" />
                    {location.email}
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
