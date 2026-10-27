import { PhotoManager } from "@/components/photos/photo-manager";
import { SiteHeader } from "@/components/site-header";
import { requireOwner } from "@/lib/auth";
import { getManagedPhotos } from "@/lib/portfolio-photos";

export default async function PhotosPage() {
  await requireOwner();

  const { photos, tableReady } = await getManagedPhotos();

  return (
    <>
      <SiteHeader title="Photos" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="max-w-3xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-accent">
            Gallery
          </p>
          <h2 className="font-serif mt-1 text-3xl text-primary md:text-5xl">Photos</h2>
          <p className="text-muted-foreground rhythm-copy mt-3 text-sm leading-relaxed md:text-base">
            Check each photo&apos;s style tags, fix anything that&apos;s off, and tap
            &ldquo;Looks right&rdquo; to confirm it. Changes show on the Portfolio
            page right away.
          </p>
        </div>

        <PhotoManager photos={photos} tableReady={tableReady} />
      </div>
    </>
  );
}
