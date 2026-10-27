-- Seasonal themes (Halloween) with an optional automatic switch back.
-- Production: run this in the Supabase SQL Editor BEFORE selecting the
-- Halloween theme on /settings, or the switch will fail.
--
-- The owner changes the theme only through set_site_theme(), which validates
-- the theme and the revert schedule together. The site calls
-- apply_due_theme_revert() while rendering; it only acts once the scheduled
-- time has passed, so it is safe for any visitor to trigger.

-- ---------------------------------------------------------------------------
-- Schedule keys: ISO-8601 UTC timestamp and the theme to switch back to.
-- Empty strings mean "no automatic switch back".
-- ---------------------------------------------------------------------------

insert into public.app_config (key, value)
values ('theme_revert_at', ''), ('theme_revert_to', '')
on conflict (key) do nothing;

drop policy if exists "Anyone can read active theme" on public.app_config;

create policy "Anyone can read active theme"
  on public.app_config for select
  to anon, authenticated
  using (key in ('active_theme', 'theme_revert_at', 'theme_revert_to'));

-- The app now writes through set_site_theme(). This direct-update policy is
-- kept (with the new theme added) so the previous deployment keeps working if
-- this migration is applied before the new code goes live.
drop policy if exists "Owner can update active theme" on public.app_config;

create policy "Owner can update active theme"
  on public.app_config for update
  to authenticated
  using (key = 'active_theme' and public.is_owner())
  with check (
    key = 'active_theme'
    and value in ('cherry-studio', 'pearl', 'flower', 'halloween')
  );

-- ---------------------------------------------------------------------------
-- Allowed theme ids (keep in sync with THEME_IDS in src/lib/themes.ts).
-- ---------------------------------------------------------------------------

create or replace function public.is_site_theme(p_theme text)
returns boolean
language sql
immutable
as $$
  select p_theme = any (array['cherry-studio', 'pearl', 'flower', 'halloween']);
$$;

-- ---------------------------------------------------------------------------
-- Owner: switch theme, optionally scheduling a switch back.
-- ---------------------------------------------------------------------------

create or replace function public.set_site_theme(
  p_theme text,
  p_revert_at timestamptz default null,
  p_revert_to text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the owner can change the site theme.';
  end if;

  if not public.is_site_theme(p_theme) then
    raise exception 'Invalid theme selection.';
  end if;

  if p_revert_at is not null then
    if p_revert_at <= now() then
      raise exception 'Pick a switch-back time in the future.';
    end if;
    if not public.is_site_theme(p_revert_to) or p_revert_to = p_theme then
      raise exception 'Pick a different theme to switch back to.';
    end if;
  end if;

  update public.app_config set value = p_theme where key = 'active_theme';

  update public.app_config
  set value = case
    when p_revert_at is null then ''
    else to_char(p_revert_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  end
  where key = 'theme_revert_at';

  update public.app_config
  set value = case when p_revert_at is null then '' else p_revert_to end
  where key = 'theme_revert_to';
end;
$$;

revoke execute on function public.set_site_theme(text, timestamptz, text) from public, anon;
grant execute on function public.set_site_theme(text, timestamptz, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Anyone: apply the scheduled switch back once it is due. Returns the new
-- theme id, or null when nothing was due. Idempotent under concurrent calls.
-- ---------------------------------------------------------------------------

create or replace function public.apply_due_theme_revert()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_at text;
  v_to text;
begin
  select value into v_at from public.app_config
  where key = 'theme_revert_at' for update;
  select value into v_to from public.app_config
  where key = 'theme_revert_to' for update;

  if coalesce(v_at, '') = '' or v_at::timestamptz > now()
     or not public.is_site_theme(v_to) then
    return null;
  end if;

  update public.app_config set value = v_to where key = 'active_theme';
  update public.app_config set value = ''
  where key in ('theme_revert_at', 'theme_revert_to');

  return v_to;
end;
$$;

revoke execute on function public.apply_due_theme_revert() from public;
grant execute on function public.apply_due_theme_revert() to anon, authenticated;
