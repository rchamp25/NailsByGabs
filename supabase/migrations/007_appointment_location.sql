-- Appointment location: Webster (Rochester area) or Binghamton (school year)
alter table public.appointment_slots
  add column if not exists location text not null default 'webster'
    check (location in ('webster', 'binghamton'));

create index if not exists appointment_slots_location_idx
  on public.appointment_slots (location);
