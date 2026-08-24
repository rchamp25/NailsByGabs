-- 48-hour appointment reminder tracking for client emails.

alter table public.appointment_slots
  add column if not exists reminder_48h_sent_at timestamptz;

create index if not exists appointment_slots_reminder_due_idx
  on public.appointment_slots (start_at)
  where status = 'booked'
    and booked_by is not null
    and reminder_48h_sent_at is null;

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
    booking_updated_at = now(),
    reminder_48h_sent_at = null
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
    completed_at = null,
    reminder_48h_sent_at = null
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
    completed_at = null,
    reminder_48h_sent_at = null
  where id = p_slot_id
    and status = 'booked';
end;
$$;
