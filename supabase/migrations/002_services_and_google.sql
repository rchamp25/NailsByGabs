-- Services menu (owner-editable) + Google Calendar sync fields
-- Run in Supabase SQL Editor after 001_initial.sql

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.service_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories (id) on delete cascade,
  name text not null,
  price text not null,
  note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.appointment_slots
  add column if not exists google_event_id text;

create table public.owner_integrations (
  owner_id uuid primary key references public.profiles (id) on delete cascade,
  google_refresh_token text,
  google_calendar_id text not null default 'primary',
  updated_at timestamptz not null default now()
);

alter table public.service_categories enable row level security;
alter table public.service_items enable row level security;
alter table public.owner_integrations enable row level security;

create policy "Anyone authenticated can read service categories"
  on public.service_categories for select
  to authenticated
  using (true);

create policy "Anyone can read service categories publicly"
  on public.service_categories for select
  to anon
  using (true);

create policy "Owner can manage service categories"
  on public.service_categories for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "Anyone authenticated can read service items"
  on public.service_items for select
  to authenticated
  using (true);

create policy "Anyone can read service items publicly"
  on public.service_items for select
  to anon
  using (true);

create policy "Owner can manage service items"
  on public.service_items for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "Owner can read own integrations"
  on public.owner_integrations for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Owner can upsert own integrations"
  on public.owner_integrations for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "Owner can update own integrations"
  on public.owner_integrations for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Seed default menu (skip if re-running)
insert into public.service_categories (title, sort_order) values
  ('Acrylics', 0),
  ('Gel-X', 1),
  ('Fills', 2),
  ('Add-ons / Nail Art', 3);

insert into public.service_items (category_id, name, price, note, sort_order)
select c.id, v.name, v.price, v.note, v.sort_order
from public.service_categories c
cross join lateral (
  values
    ('Acrylics', 'Full Set — Short', '$45', null::text, 0),
    ('Acrylics', 'Full Set — Medium', '$55', null, 1),
    ('Acrylics', 'Full Set — Long', '$65', null, 2),
    ('Acrylics', 'Overlay', '$50', null, 3),
    ('Gel-X', 'Soft Gel Extensions', '$60', null, 0),
    ('Gel-X', 'Gel-X with Simple Art', '$70', null, 1),
    ('Gel-X', 'Gel-X Premium Design', '$85+', 'Price varies by design', 2),
    ('Fills', 'Acrylic Fill — 2 weeks', '$40', null, 0),
    ('Fills', 'Acrylic Fill — 3 weeks', '$45', null, 1),
    ('Fills', 'Gel Fill', '$45', null, 2),
    ('Add-ons / Nail Art', 'Simple Art (per nail)', '$3+', null, 0),
    ('Add-ons / Nail Art', 'Charms / 3D Elements', '$5+', null, 1),
    ('Add-ons / Nail Art', 'Chrome / Cat Eye', '$10', null, 2),
    ('Add-ons / Nail Art', 'Removal (non-client)', '$15', null, 3)
) as v(cat_title, name, price, note, sort_order)
where c.title = v.cat_title
  and not exists (select 1 from public.service_items si where si.category_id = c.id);
