-- Analytics: booking events, profile counters, completion lifecycle.
-- All appointments are tracked; run 011_backfill_analytics.sql to import existing slots.

insert into public.app_config (key, value)
values
  ('analytics_tracking_started_at', now()::text),
  ('default_appointment_value_cents', '3900')
on conflict (key) do nothing;

alter table public.profiles
  add column if not exists appointments_booked integer not null default 0,
  add column if not exists appointments_completed integer not null default 0;

alter table public.appointment_slots
  add column if not exists booking_updated_at timestamptz,
  add column if not exists completed_at timestamptz;

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid,
  client_id uuid references public.profiles (id) on delete set null,
  event_type text not null check (
    event_type in ('booked', 'cancelled', 'released', 'completed', 'deleted')
  ),
  booking_source text check (booking_source in ('platform', 'manual')),
  location text check (location in ('webster', 'binghamton')),
  occurred_at timestamptz not null default now(),
  slot_end_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists booking_events_occurred_at_idx
  on public.booking_events (occurred_at desc);

create index if not exists booking_events_event_type_idx
  on public.booking_events (event_type);

create index if not exists booking_events_slot_id_idx
  on public.booking_events (slot_id);

alter table public.booking_events enable row level security;

create policy "Owner can read booking events"
  on public.booking_events for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.analytics_tracking_started_at()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select nullif(value, '')::timestamptz
  from public.app_config
  where key = 'analytics_tracking_started_at';
$$;

create or replace function public.log_booking_event(
  p_slot_id uuid,
  p_client_id uuid,
  p_event_type text,
  p_booking_source text,
  p_location text,
  p_slot_end_at timestamptz,
  p_occurred_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.booking_events (
    slot_id,
    client_id,
    event_type,
    booking_source,
    location,
    slot_end_at,
    occurred_at
  )
  values (
    p_slot_id,
    p_client_id,
    p_event_type,
    p_booking_source,
    p_location,
    p_slot_end_at,
    p_occurred_at
  );

  if p_event_type = 'booked' and p_client_id is not null then
    update public.profiles
    set appointments_booked = appointments_booked + 1
    where id = p_client_id;
  end if;

  if p_event_type = 'completed' and p_client_id is not null then
    update public.profiles
    set appointments_completed = appointments_completed + 1
    where id = p_client_id;
  end if;
end;
$$;

-- Touch booking_updated_at when a booked slot's appointment details change.
create or replace function public.touch_booking_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'booked'
    and (
      old.start_at is distinct from new.start_at
      or old.end_at is distinct from new.end_at
      or old.location is distinct from new.location
      or old.booked_name is distinct from new.booked_name
      or old.notes is distinct from new.notes
      or old.booked_by is distinct from new.booked_by
    ) then
    new.booking_updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists appointment_slots_touch_booking_updated_at
  on public.appointment_slots;

create trigger appointment_slots_touch_booking_updated_at
  before update on public.appointment_slots
  for each row
  execute function public.touch_booking_updated_at();

-- Owner manual / taken slots created already booked.
create or replace function public.track_manual_slot_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'booked'
    and new.booked_name is not null
    and new.booked_by is null then
    new.booking_updated_at := coalesce(new.booking_updated_at, now());

    perform public.log_booking_event(
      new.id,
      null,
      'booked',
      'manual',
      new.location,
      new.end_at
    );
  end if;

  return new;
end;
$$;

drop trigger if exists appointment_slots_track_manual_booking
  on public.appointment_slots;

create trigger appointment_slots_track_manual_booking
  before insert on public.appointment_slots
  for each row
  execute function public.track_manual_slot_booking();

-- Log when a booked slot is deleted before completion.
create or replace function public.track_slot_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'booked' and old.completed_at is null then
    perform public.log_booking_event(
      old.id,
      old.booked_by,
      'deleted',
      case
        when old.booked_by is not null then 'platform'
        else 'manual'
      end,
      old.location,
      old.end_at
    );
  end if;

  return old;
end;
$$;

drop trigger if exists appointment_slots_track_deletion
  on public.appointment_slots;

create trigger appointment_slots_track_deletion
  before delete on public.appointment_slots
  for each row
  execute function public.track_slot_deletion();

-- ---------------------------------------------------------------------------
-- Booking RPCs (with analytics)
-- ---------------------------------------------------------------------------

create or replace function public.book_appointment_slot(
  p_slot_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location text;
  v_end_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Owners cannot book slots as clients';
  end if;

  update public.appointment_slots
  set
    status = 'booked',
    booked_by = auth.uid(),
    booked_name = null,
    notes = nullif(trim(p_notes), ''),
    booking_updated_at = now()
  where id = p_slot_id
    and status = 'open'
    and start_at > now()
  returning location, end_at into v_location, v_end_at;

  if not found then
    raise exception 'Slot is not available';
  end if;

  perform public.log_booking_event(
    p_slot_id,
    auth.uid(),
    'booked',
    'platform',
    v_location,
    v_end_at
  );
end;
$$;

create or replace function public.cancel_my_booking(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booked_by uuid;
  v_location text;
  v_end_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select booked_by, location, end_at
  into v_booked_by, v_location, v_end_at
  from public.appointment_slots
  where id = p_slot_id
    and booked_by = auth.uid()
    and status = 'booked';

  if not found then
    raise exception 'Booking not found';
  end if;

  perform public.log_booking_event(
    p_slot_id,
    v_booked_by,
    'cancelled',
    'platform',
    v_location,
    v_end_at
  );

  update public.appointment_slots
  set
    status = 'open',
    booked_by = null,
    booked_name = null,
    notes = null,
    booking_updated_at = null,
    completed_at = null
  where id = p_slot_id
    and booked_by = auth.uid();
end;
$$;

create or replace function public.release_appointment_slot(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booked_by uuid;
  v_location text;
  v_end_at timestamptz;
  v_source text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the owner can release bookings';
  end if;

  select booked_by, location, end_at
  into v_booked_by, v_location, v_end_at
  from public.appointment_slots
  where id = p_slot_id
    and status = 'booked';

  if not found then
    raise exception 'Booking not found';
  end if;

  v_source := case
    when v_booked_by is not null then 'platform'
    else 'manual'
  end;

  perform public.log_booking_event(
    p_slot_id,
    v_booked_by,
    'released',
    v_source,
    v_location,
    v_end_at
  );

  update public.appointment_slots
  set
    status = 'open',
    booked_by = null,
    booked_name = null,
    notes = null,
    booking_updated_at = null,
    completed_at = null
  where id = p_slot_id
    and status = 'booked';
end;
$$;

grant execute on function public.release_appointment_slot(uuid) to authenticated;

-- Mark completed 24h after end_at AND 24h after last booking change.
create or replace function public.mark_completed_appointments()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count integer := 0;
  v_completed_at timestamptz;
begin
  for v_row in
    select
      s.id,
      s.booked_by,
      s.location,
      s.end_at,
      coalesce(s.booking_updated_at, s.created_at) as booking_anchor
    from public.appointment_slots s
    where s.status = 'booked'
      and s.completed_at is null
      and s.end_at <= now()
      and coalesce(s.booking_updated_at, s.created_at) + interval '24 hours' <= now()
      and exists (
        select 1
        from public.booking_events e
        where e.slot_id = s.id
          and e.event_type = 'booked'
      )
      and not exists (
        select 1
        from public.booking_events e
        where e.slot_id = s.id
          and e.event_type in ('cancelled', 'released', 'deleted')
          and e.occurred_at > (
            select max(e2.occurred_at)
            from public.booking_events e2
            where e2.slot_id = s.id
              and e2.event_type = 'booked'
          )
      )
  loop
    v_completed_at := greatest(v_row.end_at, v_row.booking_anchor) + interval '24 hours';

    update public.appointment_slots
    set completed_at = v_completed_at
    where id = v_row.id
      and completed_at is null;

    perform public.log_booking_event(
      v_row.id,
      v_row.booked_by,
      'completed',
      case
        when v_row.booked_by is not null then 'platform'
        else 'manual'
      end,
      v_row.location,
      v_row.end_at,
      v_completed_at
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.mark_completed_appointments() to service_role;
