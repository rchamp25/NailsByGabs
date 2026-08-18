-- Rename night-chrome theme preset to flower
update public.app_config
set value = 'flower'
where key = 'active_theme'
  and value = 'night-chrome';

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
    and value in ('cherry-studio', 'pearl', 'flower')
  );
