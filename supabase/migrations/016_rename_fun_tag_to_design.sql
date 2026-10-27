-- Rename the gallery style tag "Fun" to "Design" (owner request, 2026-10-27).
-- Run after 015_portfolio_photos.sql. Safe to re-run.

alter table public.portfolio_photos
  drop constraint if exists portfolio_photos_tags_check;

update public.portfolio_photos
set tags = array_replace(tags, 'Fun', 'Design'),
    updated_at = now()
where 'Fun' = any(tags);

-- Keep in sync with STYLE_TAGS in src/lib/portfolio.ts.
alter table public.portfolio_photos
  add constraint portfolio_photos_tags_check
  check (tags <@ array['Seasonal', 'Aura', 'Blooming', 'Design', 'Fruit',
                       'Ombre', 'French', 'Chrome', 'Cat Eye', '3D']::text[]);
