-- Cuticle oil page (owner-editable scents, price, order link) and loyalty
-- membership (owner-controlled flag on client profiles).
-- Production: run in the Supabase SQL Editor. Safe to re-run. The site keeps
-- working before this is applied (the new pages show "coming soon").

-- ---------------------------------------------------------------------------
-- Cuticle oil scents
-- ---------------------------------------------------------------------------

create table if not exists public.cuticle_oil_scents (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  sold_out boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cuticle_oil_scents enable row level security;

drop policy if exists "Anyone can read cuticle_oil_scents" on public.cuticle_oil_scents;
create policy "Anyone can read cuticle_oil_scents"
  on public.cuticle_oil_scents for select
  to anon, authenticated
  using (true);

drop policy if exists "Owner manages cuticle_oil_scents" on public.cuticle_oil_scents;
create policy "Owner manages cuticle_oil_scents"
  on public.cuticle_oil_scents for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

grant select on public.cuticle_oil_scents to anon, authenticated;
grant insert, update, delete on public.cuticle_oil_scents to authenticated;

-- ---------------------------------------------------------------------------
-- Price (one size, same for every scent) and order link (Google Form), stored
-- in app_config and publicly readable. An empty order link means "not set
-- yet". The app only accepts https:// links.
-- ---------------------------------------------------------------------------

insert into public.app_config (key, value)
values ('cuticle_oil_order_url', ''), ('cuticle_oil_price', '$12')
on conflict (key) do nothing;

drop policy if exists "Anyone can read active theme" on public.app_config;
create policy "Anyone can read active theme"
  on public.app_config for select
  to anon, authenticated
  using (key in (
    'active_theme', 'theme_revert_at', 'theme_revert_to',
    'cuticle_oil_order_url', 'cuticle_oil_price'
  ));

drop policy if exists "Owner can update cuticle oil order link" on public.app_config;
drop policy if exists "Owner can update cuticle oil settings" on public.app_config;
create policy "Owner can update cuticle oil settings"
  on public.app_config for update
  to authenticated
  using (key in ('cuticle_oil_order_url', 'cuticle_oil_price') and public.is_owner())
  with check (
    (key = 'cuticle_oil_order_url'
      and (value = '' or (value ~ '^https://' and char_length(value) <= 500)))
    or (key = 'cuticle_oil_price'
      and char_length(btrim(value)) between 1 and 20)
  );

-- ---------------------------------------------------------------------------
-- Loyalty membership
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists loyalty_member boolean not null default false,
  add column if not exists loyalty_member_since timestamptz;

-- Clients may only edit their own name. The original "Users can update own
-- profile name" policy (001) allowed any column on their own row, which would
-- let a client mark themselves a loyalty member (or change their appointment
-- counters). Column privileges close that; security definer functions and the
-- service role are unaffected.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Owner turns membership on/off. Returns true when the client was newly added
-- (so the app knows to send the welcome email).
create or replace function public.set_loyalty_member(p_client_id uuid, p_member boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_member boolean;
begin
  if not public.is_owner() then
    raise exception 'Only the owner can change loyalty membership.';
  end if;

  select loyalty_member into v_was_member
  from public.profiles
  where id = p_client_id and role = 'client'
  for update;

  if not found then
    raise exception 'Client not found.';
  end if;

  update public.profiles
  set loyalty_member = p_member,
      loyalty_member_since = case
        when p_member and not v_was_member then now()
        when p_member then loyalty_member_since
        else null
      end
  where id = p_client_id;

  return p_member and not v_was_member;
end;
$$;

revoke execute on function public.set_loyalty_member(uuid, boolean) from public, anon;
grant execute on function public.set_loyalty_member(uuid, boolean) to authenticated;
