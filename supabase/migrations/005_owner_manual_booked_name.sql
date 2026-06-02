-- Allow owner-created taken slots with a manual client name.
-- These are booked (status='booked') without linking to a platform user.

alter table public.appointment_slots
  add column if not exists booked_name text;

-- Keep existing behavior for app logic:
-- - booked_by remains null for owner-manual bookings
-- - booked_name stores the display name for owner calendar views
