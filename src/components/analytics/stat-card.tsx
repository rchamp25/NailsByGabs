import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "primary" | "accent" | "muted";
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  accent = "primary",
  className,
}: StatCardProps) {
  const accentClass =
    accent === "accent"
      ? "text-accent"
      : accent === "muted"
        ? "text-muted-foreground"
        : "text-primary";

  return (
    <article
      className={cn(
        "motion-card rounded-xl border border-accent/20 bg-background/75 p-5 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">
        {label}
      </p>
      <p className={cn("font-serif mt-2 text-3xl md:text-4xl", accentClass)}>
        {value}
      </p>
      {hint ? (
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          {hint}
        </p>
      ) : null}
    </article>
  );
}
