-- Owner notification config (uses owner_email from 001; optional override email)
insert into public.app_config (key, value)
values ('owner_notification_email', '')
on conflict (key) do nothing;

alter table public.app_config enable row level security;

drop policy if exists "Authenticated can read app_config" on public.app_config;

create policy "Authenticated can read app_config"
  on public.app_config for select
  to authenticated
  using (true);
