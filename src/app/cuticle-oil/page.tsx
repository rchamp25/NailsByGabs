import { CuticleOilEditor } from "@/components/cuticle-oil/cuticle-oil-editor";
import { CuticleOilMenu, CuticleOilOrderButton } from "@/components/cuticle-oil/cuticle-oil-menu";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile } from "@/lib/auth";
import { getCuticleOilPage } from "@/lib/cuticle-oil";

export default async function CuticleOilPage() {
  const [{ profile }, oil] = await Promise.all([
    getSessionProfile(),
    getCuticleOilPage(),
  ]);

  const isOwner = profile?.role === "owner";

  return (
    <>
      <SiteHeader title="Cuticle Oil" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <ScrollReveal>
          <div className="mx-auto w-full max-w-4xl text-center">
            <p className="section-kicker text-sm uppercase tracking-widest text-accent">
              Aftercare
            </p>
            <h2 className="font-serif mt-1 text-3xl text-primary md:text-5xl">
              Cuticle oil
            </h2>
            <p className="text-muted-foreground rhythm-copy mx-auto mt-3 text-sm leading-relaxed md:text-base">
              Keep your cuticles soft and your set looking fresh between appointments. Pick
              a scent and order through the form. Every bottle is 30 ml.
            </p>
            {!isOwner && oil.ready && (
              <div className="mt-5">
                <CuticleOilOrderButton orderUrl={oil.orderUrl} />
              </div>
            )}
          </div>
        </ScrollReveal>

        {isOwner ? <CuticleOilEditor {...oil} /> : <CuticleOilMenu {...oil} />}
      </div>
    </>
  );
}
