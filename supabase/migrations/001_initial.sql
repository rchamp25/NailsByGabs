-- NailsByGabs: profiles + appointment slots
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table public.app_config (
  key text primary key,
  value text not null
);

insert into public.app_config (key, value)
values ('owner_email', 'gabs@example.com')
on conflict (key) do nothing;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'client' check (role in ('owner', 'client')),
  created_at timestamptz not null default now()
);

create table public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'booked')),
  booked_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint appointment_slots_end_after_start check (end_at > start_at)
);

create index appointment_slots_start_at_idx on public.appointment_slots (start_at);

alter table public.profiles enable row level security;
alter table public.appointment_slots enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile name"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Slots: authenticated users can read all slots
create policy "Slots are viewable by authenticated users"
  on public.appointment_slots for select
  to authenticated
  using (true);

create policy "Owner can insert slots"
  on public.appointment_slots for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  );

create policy "Owner can delete slots"
  on public.appointment_slots for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  );

create policy "Owner can update any slot"
  on public.appointment_slots for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  );

-- New user → profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_email text;
  assigned_role text := 'client';
begin
  select lower(value) into owner_email
  from public.app_config
  where key = 'owner_email';

  if owner_email is not null and lower(new.email) = owner_email then
    assigned_role := 'owner';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    assigned_role
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Client books an open slot (notes optional)
create or replace function public.book_appointment_slot(
  p_slot_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'Owners cannot book slots as clients';
  end if;

  update public.appointment_slots
  set
    status = 'booked',
    booked_by = auth.uid(),
    notes = nullif(trim(p_notes), '')
  where id = p_slot_id
    and status = 'open'
    and start_at > now();

  if not found then
    raise exception 'Slot is not available';
  end if;
end;
$$;

grant execute on function public.book_appointment_slot(uuid, text) to authenticated;

-- Client cancels own booking
create or replace function public.cancel_my_booking(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.appointment_slots
  set status = 'open', booked_by = null, notes = null
  where id = p_slot_id
    and booked_by = auth.uid();

  if not found then
    raise exception 'Booking not found';
  end if;
end;
$$;

grant execute on function public.cancel_my_booking(uuid) to authenticated;
