import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="border-border/60 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm transition-[background-color,box-shadow] duration-350 ease-luxury md:px-6 max-md:shadow-[0_4px_24px_-12px_rgb(140_207_155_/_0.45)]">
      <SidebarTrigger className="text-rose-red transition-colors duration-300 ease-luxury hover:text-gold" />
      <div className="h-5 w-px bg-gold/40" />
      <h1 className="font-serif text-xl text-foreground md:text-2xl">{title}</h1>
    </header>
  );
}
