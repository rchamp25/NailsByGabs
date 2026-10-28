"use client";

import { useActionState } from "react";

import {
  addCuticleOilScent,
  deleteCuticleOilScent,
  setCuticleOilOrderUrl,
  setCuticleOilPrice,
  updateCuticleOilScent,
  type CuticleOilActionState,
} from "@/app/cuticle-oil/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CuticleOilPage, CuticleOilScent } from "@/lib/cuticle-oil";
import { CUTICLE_OIL_LIMITS, CUTICLE_OIL_SIZE } from "@/lib/cuticle-oil-limits";

type Action = (
  prev: CuticleOilActionState | null,
  formData: FormData
) => Promise<CuticleOilActionState>;

const cardClass =
  "rounded-2xl border border-accent/25 bg-card/90 p-5 shadow-sm backdrop-blur-sm md:p-6";
const cardTitleClass = "font-serif border-b border-accent/30 pb-3 text-2xl text-primary";

function ActionMessage({ state }: { state: CuticleOilActionState | null }) {
  if (state?.error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {state.error}
      </p>
    );
  }
  if (state?.success && state.message) {
    return (
      <p className="text-sm text-primary" role="status">
        {state.message}
      </p>
    );
  }
  return null;
}

/** Remove button with a confirm prompt, so a stray tap can't delete a row. */
function RemoveForm({ id, action, what }: { id: string; action: Action; what: string }) {
  const [state, formAction, pending] = useActionState<CuticleOilActionState | null, FormData>(
    action,
    null
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Remove ${what}?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending} className="min-h-9 text-muted-foreground">
        {pending ? "Removing…" : "Remove"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

function OrderLinkForm({ orderUrl }: { orderUrl: string }) {
  const [state, formAction, pending] = useActionState<CuticleOilActionState | null, FormData>(
    setCuticleOilOrderUrl,
    null
  );

  return (
    <section className={cardClass}>
      <h3 className={cardTitleClass}>Order form link</h3>
      <form action={formAction} className="mt-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="cuticle-oil-order-url" className="text-xs">
            Google Form link
          </Label>
          <Input
            id="cuticle-oil-order-url"
            name="orderUrl"
            type="url"
            inputMode="url"
            defaultValue={orderUrl}
            placeholder="https://forms.gle/…"
            maxLength={CUTICLE_OIL_LIMITS.orderUrl}
          />
          <p className="text-muted-foreground text-xs">
            Visitors see an &ldquo;Order now&rdquo; button that opens this link. Leave it empty to
            show &ldquo;Ordering opens soon&rdquo; instead.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save link"}
          </Button>
          <ActionMessage state={state} />
        </div>
      </form>
    </section>
  );
}

function PriceForm({ price }: { price: string }) {
  const [state, formAction, pending] = useActionState<CuticleOilActionState | null, FormData>(
    setCuticleOilPrice,
    null
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <div className="space-y-1">
        <Label htmlFor="cuticle-oil-price" className="text-xs">
          Price per {CUTICLE_OIL_SIZE}
        </Label>
        <Input
          id="cuticle-oil-price"
          name="price"
          defaultValue={price}
          placeholder="e.g. $12"
          required
          maxLength={CUTICLE_OIL_LIMITS.price}
          className="max-w-40"
        />
        <p className="text-muted-foreground text-xs">Same price for every scent.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save price"}
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

function ScentRow({ scent }: { scent: CuticleOilScent }) {
  const [state, formAction, pending] = useActionState<CuticleOilActionState | null, FormData>(
    updateCuticleOilScent,
    null
  );

  return (
    <li className="border-border/60 border-b py-4 last:border-0">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={scent.id} />
        <div className="space-y-1">
          <Label htmlFor={`oil-scent-${scent.id}`} className="text-xs">
            Scent name
          </Label>
          <Input
            id={`oil-scent-${scent.id}`}
            name="name"
            defaultValue={scent.name}
            required
            maxLength={CUTICLE_OIL_LIMITS.scentName}
          />
        </div>
        <label className="flex min-h-9 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="soldOut"
            defaultChecked={scent.soldOut}
            className="size-4 accent-[var(--primary)]"
          />
          Sold out
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <ActionMessage state={state} />
        </div>
      </form>
      <RemoveForm id={scent.id} action={deleteCuticleOilScent} what={`“${scent.name}”`} />
    </li>
  );
}

function AddScentForm() {
  const [state, formAction, pending] = useActionState<CuticleOilActionState | null, FormData>(
    addCuticleOilScent,
    null
  );

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-xl border border-dashed border-accent/40 p-4">
      <div className="space-y-1">
        <Label htmlFor="oil-new-scent" className="text-sm font-medium">
          Add a scent
        </Label>
        <Input
          id="oil-new-scent"
          name="name"
          placeholder="e.g. Vanilla"
          required
          maxLength={CUTICLE_OIL_LIMITS.scentName}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Adding…" : "Add scent"}
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

/** Owner view of /cuticle-oil: the same cards as visitors see, editable in place. */
export function CuticleOilEditor({ scents, price, orderUrl, ready }: CuticleOilPage) {
  if (!ready) {
    return (
      <p className="text-muted-foreground mx-auto w-full max-w-4xl rounded-xl border border-dashed p-8 text-center text-sm">
        Run <code className="text-xs">017_cuticle_oil_and_loyalty.sql</code> in Supabase to
        turn on the editable cuticle oil page.
      </p>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
      <p className="md:col-span-2 rounded-xl border border-accent/30 bg-secondary/60 px-4 py-3 text-sm text-primary">
        Owner mode — changes appear for visitors as soon as you save. Sign out (or use a
        private window) to see the visitor view.
      </p>

      {/* Sized to its one field rather than stretched to the Scents list. */}
      <section className={`${cardClass} md:self-start`}>
        <h3 className={cardTitleClass}>Price</h3>
        <PriceForm price={price} />
      </section>

      <section className={cardClass}>
        <h3 className={cardTitleClass}>Scents</h3>
        {scents.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">No scents yet.</p>
        ) : (
          <ul className="mt-2">
            {scents.map((scent) => (
              <ScentRow key={scent.id} scent={scent} />
            ))}
          </ul>
        )}
        <AddScentForm />
      </section>

      <div className="md:col-span-2">
        <OrderLinkForm orderUrl={orderUrl} />
      </div>
    </div>
  );
}
