-- Site-wide theme preset (owner-selectable)
insert into public.app_config (key, value)
values ('active_theme', 'cherry-studio')
on conflict (key) do nothing;

-- Anonymous + authenticated visitors can read the active theme
drop policy if exists "Anyone can read active theme" on public.app_config;

create policy "Anyone can read active theme"
  on public.app_config for select
  to anon, authenticated
  using (key = 'active_theme');

-- Owner can switch between approved presets
drop policy if exists "Owner can update active theme" on public.app_config;

create policy "Owner can update active theme"
  on public.app_config for update
  to authenticated
  using (
    key = 'active_theme'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  )
  with check (
    key = 'active_theme'
    and value in ('cherry-studio', 'pearl', 'night-chrome')
  );
