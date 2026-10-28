-- Members-only appointment times (loyalty "booking priority").
-- Gabs can mark an open slot members-only. Until 24 hours before it starts,
-- only loyalty members can book it; after that anyone can. Non-members still
-- see the slot (the app shows it as locked).
-- Requires 017 (profiles.loyalty_member). Production: run in the Supabase SQL
-- Editor after 017. Safe to re-run. The site keeps working before this is
-- applied (the members-only checkbox reports that the migration is missing).

alter table public.appointment_slots
  add column if not exists members_only boolean not null default false;

-- Same as 012's version plus the members-only check.
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
  v_is_member boolean;
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

  select coalesce(loyalty_member, false) into v_is_member
  from public.profiles
  where id = auth.uid();
  v_is_member := coalesce(v_is_member, false);

  if not v_is_member and exists (
    select 1 from public.appointment_slots
    where id = p_slot_id
      and status = 'open'
      and members_only
      and start_at > now() + interval '24 hours'
  ) then
    raise exception 'This time is reserved for loyalty members until 24 hours before the appointment.';
  end if;

  update public.appointment_slots
  set
    status = 'booked',
    booked_by = auth.uid(),
    booked_name = null,
    notes = nullif(trim(p_notes), ''),
    booking_updated_at = now(),
    reminder_48h_sent_at = null
  where id = p_slot_id
    and status = 'open'
    and start_at > now()
    -- Repeats the check above atomically, in case the flag changed meanwhile.
    and (v_is_member or not members_only or start_at <= now() + interval '24 hours')
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
