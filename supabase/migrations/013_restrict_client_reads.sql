-- Restrict client reads: clients see only their own profile, open slots and
-- their own bookings. Other clients' bookings are exposed as times only via
-- get_taken_slots(), and app_config (owner email) is owner-only.
-- Also revokes direct API access to internal security definer functions.

-- ---------------------------------------------------------------------------
-- Helper: owner check for policies (security definer avoids RLS recursion
-- when used in a policy on profiles itself).
-- ---------------------------------------------------------------------------

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles: own row, or every row for the owner.
-- ---------------------------------------------------------------------------

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can read own profile; owner reads all" on public.profiles;

create policy "Users can read own profile; owner reads all"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_owner());

-- ---------------------------------------------------------------------------
-- Slots: open slots and own bookings, or every row for the owner.
-- ---------------------------------------------------------------------------

drop policy if exists "Slots are viewable by authenticated users" on public.appointment_slots;
drop policy if exists "Clients read open or own slots; owner reads all" on public.appointment_slots;

create policy "Clients read open or own slots; owner reads all"
  on public.appointment_slots for select
  to authenticated
  using (
    status = 'open'
    or booked_by = auth.uid()
    or public.is_owner()
  );

-- Upcoming slots booked by someone else, without names or notes, so the
-- client calendar can still show them as Taken.
create or replace function public.get_taken_slots()
returns table (
  id uuid,
  start_at timestamptz,
  end_at timestamptz,
  location text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.start_at, s.end_at, s.location
  from public.appointment_slots s
  where auth.uid() is not null
    and s.status = 'booked'
    and s.booked_by is distinct from auth.uid()
    and s.end_at >= now()
  order by s.start_at;
$$;

revoke execute on function public.get_taken_slots() from public, anon;
grant execute on function public.get_taken_slots() to authenticated;

-- ---------------------------------------------------------------------------
-- app_config: owner reads all; everyone keeps read access to active_theme
-- via the existing "Anyone can read active theme" policy.
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can read app_config" on public.app_config;
drop policy if exists "Owner can read app_config" on public.app_config;

create policy "Owner can read app_config"
  on public.app_config for select
  to authenticated
  using (public.is_owner());

-- ---------------------------------------------------------------------------
-- Internal functions: callable only from other functions and the service
-- role, not directly through the API.
-- ---------------------------------------------------------------------------

revoke execute on function public.log_booking_event(
  uuid, uuid, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated;

revoke execute on function public.mark_completed_appointments()
  from public, anon, authenticated;
grant execute on function public.mark_completed_appointments() to service_role;

revoke execute on function public.analytics_tracking_started_at()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Check: review the remaining read policies. Any extra policy using (true)
-- on these tables (e.g. one created in the dashboard) would undo this fix.
-- ---------------------------------------------------------------------------

select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'appointment_slots', 'app_config')
order by tablename, cmd, policyname;
