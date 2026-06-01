"use client";

import { useActionState } from "react";

import { updateServiceItem, type ServicesActionState } from "@/app/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServiceCategory } from "@/types/services";

function ServiceRow({
  item,
  editable,
}: {
  item: ServiceCategory["items"][number];
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    ServicesActionState | null,
    FormData
  >(updateServiceItem, null);

  if (!editable) {
    return (
      <li className="flex items-baseline gap-3 py-3">
        <span className="shrink-0 font-medium text-foreground">{item.name}</span>
        <span className="gold-divider min-w-[2rem] flex-1 self-center" aria-hidden />
        <span className="shrink-0 font-serif text-lg text-rose-red">{item.price}</span>
        {item.note && (
          <span className="text-muted-foreground w-full text-xs">{item.note}</span>
        )}
      </li>
    );
  }

  return (
    <li className="border-border/60 border-b py-4 last:border-0">
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <input type="hidden" name="itemId" value={item.id} />
        <div>
          <p className="font-medium">{item.name}</p>
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
            <p className="text-sm text-rose-red" role="alert">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="text-sm text-rose-red-deep" role="status">
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
    <div className="grid max-w-3xl gap-8">
      {isOwner && (
        <p className="rounded-xl border border-gold/30 bg-pastel-pink/40 px-4 py-3 text-sm text-rose-red-deep">
          Owner mode — update prices below and click Save on each row.
        </p>
      )}
      {categories.map((category) => (
        <section
          key={category.id}
          className="rounded-2xl border border-gold/25 bg-card/90 p-6 shadow-sm backdrop-blur-sm"
        >
          <h3 className="font-serif border-b border-gold/30 pb-3 text-2xl text-rose-red-deep">
            {category.title}
          </h3>
          <ul className="mt-2">
            {category.items.map((item) => (
              <ServiceRow key={item.id} item={item} editable={isOwner} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
