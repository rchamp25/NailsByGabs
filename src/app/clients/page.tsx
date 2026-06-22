import { redirect } from "next/navigation";

import { ClientsList } from "@/components/clients/clients-list";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile } from "@/lib/auth";
import { listOwnerClients } from "@/lib/clients";

export default async function ClientsPage() {
  const { profile } = await getSessionProfile();

  if (!profile || profile.role !== "owner") {
    redirect("/");
  }

  const { clients, error } = await listOwnerClients();

  return (
    <>
      <SiteHeader title="Clients" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="max-w-3xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-gold">
            Accounts
          </p>
          <h2 className="font-serif mt-1 text-3xl text-rose-red md:text-5xl">
            Clients
          </h2>
          <p className="text-muted-foreground rhythm-copy mt-3 text-sm leading-relaxed md:text-base">
            View who has signed up, check whether their email is verified, and
            send a password reset link if they need help logging in.
          </p>
        </div>

        {error ? (
          <p className="text-destructive rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            {error}
          </p>
        ) : (
          <ClientsList clients={clients} />
        )}
      </div>
    </>
  );
}
