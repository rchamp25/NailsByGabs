import { cn } from "@/lib/utils";

export type SplitBarItem = {
  id: string;
  label: string;
  value: number;
  sublabel?: string;
  tone?: "primary" | "accent" | "muted";
};

type SplitBarChartProps = {
  title: string;
  description?: string;
  items: SplitBarItem[];
  valueFormatter?: (value: number) => string;
  className?: string;
};

const toneFill: Record<NonNullable<SplitBarItem["tone"]>, string> = {
  primary: "bg-primary/80",
  accent: "bg-accent/80",
  muted: "bg-muted-foreground/50",
};

export function SplitBarChart({
  title,
  description,
  items,
  valueFormatter = (v) => String(v),
  className,
}: SplitBarChartProps) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section
      className={cn(
        "rounded-xl border border-accent/20 bg-background/75 p-5 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <div className="mb-5">
        <h3 className="font-serif text-xl text-primary md:text-2xl">{title}</h3>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>

      <ul className="space-y-4">
        {items.map((item) => {
          const width = `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%`;
          const tone = item.tone ?? "primary";

          return (
            <li key={item.id}>
              <div className="mb-1.5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  {item.sublabel ? (
                    <p className="text-muted-foreground text-xs">
                      {item.sublabel}
                    </p>
                  ) : null}
                </div>
                <p className="font-serif text-lg text-primary">
                  {valueFormatter(item.value)}
                </p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700 ease-emphasis",
                    toneFill[tone]
                  )}
                  style={{ width }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
