-- Retain completed appointment rows indefinitely; remove auto-purge helper.

drop function if exists public.list_purgeable_completed_slots();
