-- Backfill analytics from existing appointment_slots and count all appointments going forward.

-- Always log analytics events (no tracking start cutoff).
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

-- Rebuild event history from slots currently on record (booked = had an appointment).
delete from public.booking_events;

update public.profiles
set
  appointments_booked = 0,
  appointments_completed = 0;

insert into public.booking_events (
  slot_id,
  client_id,
  event_type,
  booking_source,
  location,
  occurred_at,
  slot_end_at,
  metadata
)
select
  s.id,
  s.booked_by,
  'booked',
  case
    when s.booked_by is not null then 'platform'
    else 'manual'
  end,
  s.location,
  coalesce(s.booking_updated_at, s.created_at),
  s.end_at,
  jsonb_build_object(
    'backfill', true,
    'booked_name', s.booked_name
  )
from public.appointment_slots s
where s.status = 'booked';

-- Infer completed appointments: 24h after end_at with no intervening changes.
with completion_candidates as (
  select
    s.id,
    s.booked_by,
    s.location,
    s.end_at,
    greatest(
      s.end_at,
      coalesce(s.booking_updated_at, s.created_at)
    ) + interval '24 hours' as inferred_completed_at
  from public.appointment_slots s
  where s.status = 'booked'
    and s.end_at <= now()
    and coalesce(s.booking_updated_at, s.created_at) + interval '24 hours' <= now()
)
insert into public.booking_events (
  slot_id,
  client_id,
  event_type,
  booking_source,
  location,
  occurred_at,
  slot_end_at,
  metadata
)
select
  c.id,
  c.booked_by,
  'completed',
  case
    when c.booked_by is not null then 'platform'
    else 'manual'
  end,
  c.location,
  c.inferred_completed_at,
  c.end_at,
  '{"backfill": true}'::jsonb
from completion_candidates c;

with completion_candidates as (
  select
    s.id,
    greatest(
      s.end_at,
      coalesce(s.booking_updated_at, s.created_at)
    ) + interval '24 hours' as inferred_completed_at
  from public.appointment_slots s
  where s.status = 'booked'
    and s.end_at <= now()
    and coalesce(s.booking_updated_at, s.created_at) + interval '24 hours' <= now()
)
update public.appointment_slots s
set completed_at = c.inferred_completed_at
from completion_candidates c
where s.id = c.id
  and s.completed_at is null;

-- Tie platform bookings to profile counters from the rebuilt event log.
update public.profiles p
set appointments_booked = stats.booked_count
from (
  select
    client_id,
    count(*)::integer as booked_count
  from public.booking_events
  where event_type = 'booked'
    and client_id is not null
  group by client_id
) as stats
where p.id = stats.client_id;

update public.profiles p
set appointments_completed = stats.completed_count
from (
  select
    client_id,
    count(*)::integer as completed_count
  from public.booking_events
  where event_type = 'completed'
    and client_id is not null
  group by client_id
) as stats
where p.id = stats.client_id;

-- Mark when full-history analytics began (includes backfill).
insert into public.app_config (key, value)
values (
  'analytics_tracking_started_at',
  (
    select coalesce(
      min(occurred_at)::text,
      now()::text
    )
    from public.booking_events
  )
)
on conflict (key) do update
set value = excluded.value;

-- Use inferred completion time for cron-marked appointments going forward.
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
