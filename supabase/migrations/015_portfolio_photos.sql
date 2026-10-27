-- Owner-editable gallery metadata (the /photos page).
-- The photo files and their default tags/titles live in src/lib/portfolio.ts;
-- a row here exists only once the owner saves or reorders a photo, and its
-- values override those defaults. Without this table the site keeps showing
-- the defaults (and /photos explains that this migration is needed).

create table if not exists public.portfolio_photos (
  file text primary key
    check (file ~ '^[A-Za-z0-9._-]+\.webp$'),
  -- Null means "use the tags joined" (e.g. "French & Fun").
  title text
    check (title is null or char_length(title) between 1 and 60),
  -- Keep in sync with STYLE_TAGS in src/lib/portfolio.ts.
  tags text[] not null default '{}'
    check (tags <@ array['Seasonal', 'Aura', 'Blooming', 'Fun', 'Fruit',
                         'Ombre', 'French', 'Chrome', 'Cat Eye', '3D']::text[]),
  -- Shown in the moving "Featured" carousel on the home page.
  featured boolean not null default true,
  -- Gallery position (ascending); null keeps the default order from code.
  sort_order integer,
  needs_review boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_photos enable row level security;

drop policy if exists "Anyone can read portfolio photos" on public.portfolio_photos;
create policy "Anyone can read portfolio photos"
  on public.portfolio_photos for select
  to anon, authenticated
  using (true);

drop policy if exists "Owner can add portfolio photos" on public.portfolio_photos;
create policy "Owner can add portfolio photos"
  on public.portfolio_photos for insert
  to authenticated
  with check (public.is_owner());

drop policy if exists "Owner can edit portfolio photos" on public.portfolio_photos;
create policy "Owner can edit portfolio photos"
  on public.portfolio_photos for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "Owner can remove portfolio photos" on public.portfolio_photos;
create policy "Owner can remove portfolio photos"
  on public.portfolio_photos for delete
  to authenticated
  using (public.is_owner());

grant select on public.portfolio_photos to anon, authenticated;
grant insert, update, delete on public.portfolio_photos to authenticated;
