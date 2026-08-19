"use client";

import { useActionState } from "react";

import { updateServiceItem, type ServicesActionState } from "@/app/services/actions";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServiceCategory } from "@/types/services";

function splitServiceName(name: string): {
  primary: string;
  secondary: string | null;
} {
  const match = /^(.+?)\s*(\([^)]+\))\s*$/.exec(name.trim());
  if (!match) {
    return { primary: name, secondary: null };
  }
  return { primary: match[1].trim(), secondary: match[2].trim() };
}

function ServiceRow({
  item,
  editable,
  index,
}: {
  item: ServiceCategory["items"][number];
  editable: boolean;
  index: number;
}) {
  const [state, formAction, pending] = useActionState<
    ServicesActionState | null,
    FormData
  >(updateServiceItem, null);

  if (!editable) {
    const { primary, secondary } = splitServiceName(item.name);

    return (
      <li className="border-border/40 border-b py-3 last:border-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug text-foreground">{primary}</p>
            {secondary && (
              <p className="text-muted-foreground mt-1 text-xs leading-snug">
                {secondary}
              </p>
            )}
            {item.note && (
              <p className="text-muted-foreground mt-1 text-xs italic">{item.note}</p>
            )}
          </div>
          <span className="shrink-0 font-serif text-lg text-primary">{item.price}</span>
        </div>
        <span
          className="accent-divider mt-3 hidden h-px w-full sm:block"
          aria-hidden
        />
      </li>
    );
  }

  const { primary, secondary } = splitServiceName(item.name);

  return (
    <li className="border-border/60 border-b py-4 last:border-0">
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <input type="hidden" name="itemId" value={item.id} />
        <div>
          <p className="font-medium">{primary}</p>
          {secondary && (
            <p className="text-muted-foreground mt-1 text-xs">{secondary}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`price-${item.id}`} className="text-xs">
            Price
          </Label>
          <Input
            id={`price-${item.id}`}
            name="price"
            defaultValue={item.price}
            required
            className="w-full sm:w-28"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`note-${item.id}`} className="text-xs">
            Note (optional)
          </Label>
          <Input
            id={`note-${item.id}`}
            name="note"
            defaultValue={item.note ?? ""}
            placeholder="e.g. Price varies"
            className="w-full sm:w-44"
          />
        </div>
        <div className="sm:col-span-3 flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          {state?.error && (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="text-sm text-primary" role="status">
              Saved
            </p>
          )}
        </div>
      </form>
    </li>
  );
}

type ServicesMenuProps = {
  categories: ServiceCategory[];
  isOwner: boolean;
};

export function ServicesMenu({ categories, isOwner }: ServicesMenuProps) {
  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
        Run <code className="text-xs">002_services_and_google.sql</code> in
        Supabase to enable the editable services menu.
      </p>
    );
  }

  return (
    <div className="grid max-w-4xl gap-6 md:grid-cols-2">
      {isOwner && (
        <p className="md:col-span-2 rounded-xl border border-accent/30 bg-secondary/60 px-4 py-3 text-sm text-primary">
          Owner mode — update prices below and click Save on each row.
        </p>
      )}
      {categories.map((category) => (
        <ScrollReveal key={category.id}>
          <section className="spotlight-card rounded-2xl border border-accent/25 bg-card/90 p-5 shadow-sm backdrop-blur-sm md:p-6">
            <h3 className="font-serif border-b border-accent/30 pb-3 text-2xl text-primary">
              {category.title}
            </h3>
            <ul className="mt-2">
              {category.items.map((item, index) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  editable={isOwner}
                  index={index}
                />
              ))}
            </ul>
          </section>
        </ScrollReveal>
      ))}
    </div>
  );
}
