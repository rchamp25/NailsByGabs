# AGENTS.md — Shared Agent Change Log

This file is the shared memory between every AI agent that works on NailsByGabs. Before you change anything, read the **Orientation** section and at least the three most recent **Log** entries. After you finish a unit of work, add an entry. Other agents, possibly running at the same time as you, rely on this file to know what changed, why, and what is still unfinished.

`docs/PROJECT_ARCHITECTURE.md` is the long-form reference for how the system works. This file records **who changed what, when, and why**.

---

## 1. Logging Protocol

### 1.1 Agent naming

| Situation | Name to use |
|-----------|-------------|
| Claude agents | `Claude 1`, `Claude 2`, `Claude 3`, … |
| Other tools (Codex, Cursor, Copilot, etc.) | Tool name plus a number, e.g. `Codex 1`, `Cursor 1` |

- To pick your number, check the **Agent Roster** (§1.4). If no session has claimed a number for you, take the next unused number for your agent type and add yourself to the roster before writing your first entry.
- Keep that number for your whole session. A new session gets a new number. Never reuse a number someone else already holds.
- If you are a sub-agent launched by another agent, use your own number and note the parent in the entry, e.g. `Claude 4 (sub-agent of Claude 3)`.

### 1.2 Required fields for every entry

| Field | Format | Notes |
|-------|--------|-------|
| **Agent** | `Claude 2` | As defined above |
| **Date** | `YYYY-MM-DD` | |
| **Time** | `HH:MM TZ` (24-hour, e.g. `14:05 EDT`) | Use US Eastern time (`America/New_York`), the business timezone. Run `date` if unsure. |
| **Summary** | One line | Readable at a glance |
| **Commits** | Short hashes, or `uncommitted` | Update the entry if you commit later |
| **Files touched** | Paths grouped by area | Use repo-relative paths |
| **Technical explanation** | Prose plus bullets | See §1.3 |
| **Verification** | Commands and results | e.g. `npm run lint` passed, `npm run build` passed, manual check of `/book` at 375px |
| **Open items / handoff** | Bullets | Anything unfinished, risky, or needing the owner's input |

### 1.3 What a strong technical explanation covers

Write it so another agent with no context can continue your work without reading your diff first. Cover:

1. **Intent:** what the user asked for and what problem it solves.
2. **Mechanism:** how the change works. Name the components, functions, CSS tokens, RPCs, and migrations involved, and describe data flow and server/client boundaries where relevant.
3. **Decisions and alternatives:** what you chose, what you rejected, and why.
4. **Side effects:** what else this touches, such as themes, mobile layout, RLS, emails, analytics, or the cron job.
5. **Contracts changed:** new or renamed props, CSS variables, env vars, DB columns, or routes. Flag anything other agents may already depend on.
6. **Database:** new migrations must be stated explicitly. Migrations are applied **manually** in the Supabase SQL Editor, so say whether yours has been applied.

### 1.4 Agent Roster

| Agent | First active | Focus |
|-------|--------------|-------|
| Claude 1 | 2026-10-24 | Codebase review; created this file |
| Codex 1 | 2026-10-27 | Architecture reconciliation; production-state documentation |

### 1.5 House rules

- **Newest entries go at the top** of the Log (§3).
- **Do not edit or delete another agent's entry.** To correct one, add a new entry that references it, e.g. "Corrects Claude 2, 2026-10-25 14:05".
- **Concurrent work:** if your work overlaps a file another agent touched in an entry that is still open, say so in your entry and describe how you reconciled the two changes.
- **Keep docs in sync:** if your change makes `docs/PROJECT_ARCHITECTURE.md` inaccurate, update that file too or list it as an open item.
- **Never put secrets in this file**, including keys, tokens, owner phone, or emails.

### 1.6 Entry template

```markdown
### [Claude N] — YYYY-MM-DD HH:MM TZ — <one-line summary>

**Commits:** `abc1234`, `def5678` | uncommitted
**Files touched:**
- UI: `src/components/...`
- Styles: `src/app/globals.css`
- Data/DB: `supabase/migrations/0NN_....sql` (applied: yes/no)

**Technical explanation**
<Intent, mechanism, decisions, side effects, contracts changed>

**Verification**
- `npm run lint`: pass/fail
- `npm run build`: pass/fail
- Manual: <routes, viewports, themes, roles checked>

**Open items / handoff**
- ...
```

---

## 2. Orientation (current as of 2026-10-27)

### 2.1 What the product is

NailsByGabs (https://nailsbygabs.org) is the website for Gabrielle ("Gabs"), a solo GelX nail artist working in Webster/Rochester, NY and at SUNY Binghamton during the school year. The site has:

- **Public pages:** Portfolio `/`, Services & Pricing `/services`, About `/about`, Book `/book`. Booking requires login.
- **Owner-only pages:** Analytics `/analytics`, Clients `/clients`, Appearance `/settings` (theme switcher).
- **No payments on the site.** This is a deliberate, confirmed owner decision. Do not add Square, Stripe, deposits, or checkout flows.

### 2.2 Stack

Next.js 15 (App Router, Server Components, Server Actions) · React 19 · TypeScript strict · Tailwind CSS v4 (CSS-first config, no `tailwind.config`) · Radix UI primitives with shadcn-style wrappers in `src/components/ui/` · lucide-react icons · Supabase (Postgres, RLS, security-definer RPCs, Auth) · Resend (booking emails) · Brevo SMTP (auth emails, configured in Supabase) · Google Calendar API · Vercel (hosting, one daily cron) · Cloudflare DNS.

There is **no test suite**. Verify changes with:

- `npm run lint` (ESLint CLI with flat config `eslint.config.mjs`; `next lint` is no longer used)
- `npm run typecheck`
- `npm run build`, which needs Supabase env vars (see §2.5)
- manual checks in `npm run dev`

CI (`.github/workflows/ci.yml`) runs lint, typecheck, build, and a non-blocking `npm audit` on pushes to `main` and on PRs.

**Source control:** the user makes all commits and pushes manually. Agents only change files and never run `git commit`, `git push`, or other history-changing git commands.

### 2.3 Visual system: the map for the overhaul

| Concern | Where it lives |
|---------|----------------|
| Design tokens (colors, radius, gradients, glows, slot colors) | `src/app/globals.css`: `:root` / `[data-theme="…"]` blocks, mapped into Tailwind through `@theme inline` |
| Theme catalog (ids, labels, swatches) | `src/lib/themes.ts` (`THEME_IDS`, `THEME_CATALOG`) |
| Active theme | DB rows `app_config.active_theme`, `theme_revert_at`, `theme_revert_to`, read by `getThemeState()` / `getActiveThemeId()` in `src/lib/theme.ts` and applied as `<html data-theme>` in `src/app/layout.tsx`. The owner writes them only through the `set_site_theme()` RPC. A due switch-back is applied on the next request by `apply_due_theme_revert()` (migration 014) |
| Themes today | `cherry-studio` (default), `pearl`, `flower`, plus the seasonal `halloween` (dark). Adding a theme needs: a `[data-theme]` block in `globals.css`, a `THEME_IDS`/`THEME_CATALOG` entry (including the `email` palette, plus `seasonal` for holiday themes), **and a migration that adds the id to `public.is_site_theme()`** |
| Seasonal effects | `components/effects/halloween.tsx`: `HalloweenPumpkins` (faint `public/effects/pumpkins.svg` tile drifting diagonally, first child of `SidebarInset`, z-index -1 on desktop and 0 on mobile, so it paints behind the page) and `HalloweenFog` (in front of the page, below the mobile nav). Under Halloween, `.page-gradient` is transparent so the pattern shows through. Styled in the Halloween section of `globals.css`. `.seasonal-title` (header `h1`, home intro `h2`) switches to Creepster (`--font-creepster`, `preload: false`) with no glow. All CSS-only and paused for `prefers-reduced-motion`. Bats were removed on 2026-10-27 at the user's request |
| Fonts | `next/font/google` in `layout.tsx`: DM Sans (`--font-sans`) and Cormorant Garamond (`--font-serif`). `h1`–`h3` default to serif |
| Motion tokens | `--ease-luxury`, `--ease-emphasis`, `--duration-*` in `@theme inline`. A `prefers-reduced-motion` block sits at the bottom of `globals.css` |
| Layout shell | `layout.tsx`: a plain wrapper `div`, then `<main class="mobile-ambient-bg">` containing `DesktopNav`, Halloween layers, `.app-scroll-region` (with `PageMotion`), and `MobileBottomNav`. The shadcn sidebar (`ui/sidebar`, `sheet`, `tooltip`, `separator`, `skeleton`, `use-mobile`, `app-sidebar`, `sidebar-auth`) was **deleted on 2026-10-27** |
| Desktop nav | `src/components/desktop-nav.tsx` (in the root layout, so it does not re-animate on page change): one bar **pinned to the top** (`sticky`, md and up). It holds the NailsByGabs name (`seasonal-title`), labeled page tabs (active = pill), a **Loyalty** tab for members (`showLoyalty`), owner tabs, social icons, and Sign in/out. **Built to fit split-screen windows** (verified with no clipped tabs from 790px to 1600px for visitors, members, and the owner):
  - Tabs show `short` labels below `xl`; the owner's below `2xl`.
  - Tab padding is `px-3` below `lg`; the wordmark is `text-xl` below `lg`.
  - Below `xl`, the owner's Loyalty and owner pages fold into an **"Owner ▾" dropdown**, the shared `components/owner-menu.tsx` also used by the mobile bar. It sits outside the `overflow-x-auto` tab row so it can't be clipped. At `xl`+ they show inline after a divider.
  
  Items come from `src/lib/nav.ts` (`PUBLIC_NAV`, `LOYALTY_NAV`, `OWNER_NAV`, `OWNER_MENU_NAV`), shared with mobile. The hidden-sidebar history (hover tab → tall MENU tab → top bar) is in PROJECT_ARCHITECTURE §17.10 |
| Mobile nav | `src/components/mobile-bottom-nav.tsx`: pill bar with sliding indicator; items from `src/lib/nav.ts`. Everyone: Portfolio, Book, Prices, Oil, About. Members add Loyalty (6). The owner gets a sixth **Owner** item that opens an upward menu (Loyalty, Stats, Clients, Photos, Theme). The menu (`components/owner-menu.tsx`) is absolutely positioned inside the nav (no `position: fixed`) and closes on navigation, an outside tap, or Escape. `body` is a fixed-height flex column on mobile and only `.app-scroll-region` scrolls; this is what keeps the bottom nav pinned in in-app browsers |
| Page header | `src/components/site-header.tsx`: **mobile-only** title bar (plus optional `actions` and sign-in/out). On desktop it renders only a screen-reader `h1` |
| Shared page scaffolding | Each page uses `SiteHeader`, then `.page-gradient` wrapper, then `ScrollReveal` sections with a `.section-kicker` eyebrow, a serif `h2`, and a `.rhythm-copy` paragraph. **Services & Pricing, Cuticle Oil, and Loyalty use a centered column**: the intro is `mx-auto w-full max-w-4xl text-center` (Loyalty uses `max-w-3xl`) and its paragraph is `mx-auto`. The card block uses the same `mx-auto w-full max-w-*`, so both share edges. Cards side by side match heights via `[&>.scroll-reveal-inner]:h-full` on `ScrollReveal` plus `h-full` on the card. The owner's price-editor rows stack (name, then price + note) so half-width cards don't squeeze the name |
| Effects library | `src/components/effects/`: `profile-card` (About; takes `imagePosition`), `scroll-reveal` (everywhere), `halloween`. The hover/focus card glow (`.spotlight-card`) was removed everywhere on 2026-10-27 at the owner's request; do not reintroduce it. The hero-only effects (blur-text, rotating-text, silk-background, star-border) were deleted with the hero on 2026-10-27 |
| Portfolio | Photo list and **default** metadata in `src/lib/portfolio.ts` (`LABELED_SETS` with explicit tags, and `PORTFOLIO_FILE_NAMES` with tags parsed from filenames, combined into `PORTFOLIO_PHOTO_DEFAULTS`). The owner's edits live in the `portfolio_photos` table (migration 015) and are merged by `getManagedPhotos()` / `getPortfolioView()` in `src/lib/portfolio-photos.ts`, which falls back to the defaults if the table is missing. Owner editor: **`/photos`** (`components/photos/photo-manager.tsx`, `app/photos/actions.ts`) for tags, title, review status, carousel pick, and order. Public UI in `components/portfolio/`: carousel (click or tap opens `PortfolioLightbox`), showcase (clicking the active tag returns to All), and the shared lightbox |
| Photo crop points | `focal` in `LABELED_SETS`, or `focalByFileName` for filename-tagged photos, used as CSS `object-position`. Each value is the center of the nail art as a percentage of the EXIF-rotated image. Fallback: `DEFAULT_FOCAL` (`50% 58%`) |
| Image pipeline | **Originals live in git-ignored `image-originals/`**: `portfolio/` (81), `about/`, `branding/`, `loyalty/` (punch card PNG → `public/loyalty/LoyaltyPunchCard.webp`, q90), `photoshoot/` (unused Gabby Nails shoot), `retired/` (old headshot), and `review/` (tag review sheets for the owner). Web copies use the Sharp optimizer (EXIF-rotate, long edge 2000px, q80 WebP, metadata stripped). Gallery originals fell from 238 MB to 9.4 MB; the new About photo fell from 2.9 MB to 62 KB. The OG logo stays an optimized palette PNG because Next `ImageResponse` rejected an embedded WebP data URI |
| Home-page extras | `components/social-links.tsx` (Instagram/TikTok icon links, passed to `SiteHeader` through its `actions` prop) and `components/book-cta-bar.tsx` (sticky Book button; read its comment before moving it) |
| Email colors | Booking emails in `lib/notifications.ts` use `THEME_CATALOG[n].email` from `lib/themes.ts` for the active theme. **When you change theme colors in `globals.css`, update the matching `email` palette.** Supabase auth templates in `supabase/email-templates/` are static HTML pasted into the Supabase dashboard and still use the old red (`#c62828`) |
| Owner authorization | `lib/auth.ts`: `requireOwner(redirectTo)` for pages and routes (redirects), `getOwnerSession()` for Server Actions (returns null). `getSessionProfile()` is cached per request with React `cache()` |
| Cuticle oil page | `/cuticle-oil` (public). Data from `getCuticleOilPage()` in `src/lib/cuticle-oil.ts`: table `cuticle_oil_scents` (name, `sold_out`, `sort_order`), plus `app_config.cuticle_oil_price` (one price for the only size, `CUTICLE_OIL_SIZE` = "30 ml bottle"; seeded `$12`) and `app_config.cuticle_oil_order_url` (Google Form link; empty → "Ordering opens soon"). Falls back to a "coming soon" state when migration 017 is missing. The owner edits **in place on the page** (`components/cuticle-oil/cuticle-oil-editor.tsx`, actions in `app/cuticle-oil/actions.ts`). Visitors get `cuticle-oil-menu.tsx`. Limits and the https-only link check are in `src/lib/cuticle-oil-limits.ts` (client-safe) and mirror the DB checks |
| Loyalty | `profiles.loyalty_member` / `loyalty_member_since` (migration 017). `canSeeLoyalty(profile)` in `lib/auth.ts` (member or owner) gates the nav tab and `/loyalty` (others redirect to `/`). Gabs toggles membership on `/clients` (`setLoyaltyMembership` → `set_loyalty_member()` RPC). The first time a client is added, they get `notifyClientOfLoyaltyMembership()`; removal sends nothing. `/loyalty` shows Gabs's punch card image (`public/loyalty/LoyaltyPunchCard.webp`) under the intro, then the fixed perks (`PERKS`: punch card with every 9th punch 15% off; 20% off for the 20th birthday via Instagram DM coupon; members-only booking times). **Members-only slots** (`appointment_slots.members_only`, migration 018): only members can book until 24h before the start, then anyone can. Non-members see them locked. The rule lives in `src/lib/members-only.ts` for the UI and in `book_appointment_slot` for enforcement |
| Copy/content | `src/lib/data.ts` (About bio, location, socials) and `src/lib/site-metadata.ts` (site name, tagline, description, OG). Services/prices come **from the DB** (`service_categories`, `service_items`) and are owner-editable on `/services` |
| Brand assets | Raw logo source: git-ignored `image-originals/branding/source/NailsByGabsLogoSource.png`. Public `NailsByGabsLogo.png` is a cropped metadata-free palette PNG for OG/Twitter; `NailsByGabsIcon.png` is the metadata-free square favicon/shortcut/Apple icon. Desktop nav intentionally keeps the text wordmark. About photo: full-resolution `public/about/NailsByGabsAbout.webp` (6000×4000, q92, metadata stripped; original `image-originals/about/NailsByGabsAbout.JPEG`). It is shown in a 4:3 `ProfileCard` with `sizes="(min-width: 1024px) 55vw, 105vw"` and `quality={90}`. **When an image is cropped by `object-cover`, set `sizes` for the width needed to cover the card's height, not the card's width**, or it will be upscaled and blurry |

### 2.4 Constraints the owner has already confirmed (do not undo without asking)

- No payments, no booking SaaS embed.
- All times are Eastern (`src/lib/business-timezone.ts`). Never treat `datetime-local` as UTC.
- Portfolio title rules: `W` means "with" (`3DWFun` → "3D & Fun"); three or more tags are comma-joined; numeric suffixes are stripped but **`3D` is preserved**; the lightbox shows descriptors, never raw filenames.
- Branding tagline is **"GelX Nails"**.
- Desktop navigation is the pinned top tab bar; the old sidebar was deleted.
- Analytics chart behavior (zero-filled buckets, integer Y axis, no "· Today" label, 1-month hover tooltip) is owner-specified.
- Locations are **Webster** and **Binghamton**. Binghamton bookings require a client acknowledgement.

### 2.5 Known state and gotchas (verified through 2026-10-27)

- **Production and repository state (confirmed 2026-10-27 15:57 EDT):** commit `15a0180` has been pushed, local tracked files represent the GitHub repository, and production migrations 014 → 015 → 016 plus `supabase/data/portfolio_photos_2026-10-27.sql` ran without error. The export installed all 40 reviewed photo metadata rows.

- **Migrations 017 and 018 (`018_members_only_slots.sql`) are applied locally, not in production; run 017 before 018.** 018 replaces `book_appointment_slot`; keep its members-only check if that function is ever redefined. Before 018, the members-only checkbox returns a "needs migration 018" error and nothing is locked.
- **Migration 017 (`017_cuticle_oil_and_loyalty.sql`)**: not in production yet. The code is safe to deploy first: the cuticle oil page shows "coming soon", the loyalty toggle is disabled, and nobody sees the Loyalty tab. 017 also **revokes clients' blanket `UPDATE` on `profiles` and grants only `UPDATE (full_name)`**. The 001 policy had let a client edit any column of their own row (role is protected by a trigger, but the appointment counters and the new loyalty flag were not). Any future client-editable profile column needs its own column grant.
- **Architecture documentation is synchronized through migration 017.** Migration 013 (`013_restrict_client_reads.sql`, commit `4578c0b`) limits clients to their own profile, open slots, and their own bookings. Other clients' bookings arrive only as times through `get_taken_slots()`. UI that shows booked slots to clients must not expect names or notes.
- **Owner phone moved to env.** `NEXT_PUBLIC_OWNER_PHONE` (commit `1d8d878`). The About page hides the phone link when the variable is unset.
- **The 40 delivered gallery sets are reviewed and live in production metadata.** Their `portfolio_photos` rows have `needs_review=false` and override code defaults. Do not "fix" their tags in `LABELED_SETS`; the DB remains the source of truth. Newly registered photos without saved rows still default to Needs review.
- **Photo shoot images** (`image-originals/photoshoot/Gabby Nails-*.JPEG`) are intentionally unused for now. Seven of them were previously `git add`ed under `public/portfolio/`, so the user needs to unstage them (`git rm --cached`).
- **No dark mode:** the unused `dark` variant was removed on 2026-10-24. Tailwind v4's default `dark:` variant follows the OS setting, so do not add `dark:` classes.
- **Security backlog:** `docs/PROJECT_ARCHITECTURE.md` §15 lists open gaps S1–S9. S1 (`npm audit`: 1 critical, 4 high) is the most urgent. Email HTML escaping from S2 is done, but length caps are still missing. Log fixes here by S-number.
- **Local build needs env vars:** `npm run build` fails during static page generation with "Supabase is not configured" unless `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. Placeholder values are enough for a build check: `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`.
- **The local `portfolio_photos` table holds the owner's real tag-review work** (40 rows as of 2026-10-27 14:53). Tests must snapshot and restore only the rows they touch, and **never wipe the table**.
- **Carousel performance rules** (`portfolio-featured-carousel.tsx`): never put per-frame or per-gesture values (offset, dragging, paused) in React state. Keep `CarouselCard` memoized with stable props (`onOpen(index)`), and keep the loop to the real set plus `LOOP_CLONES`. Each of these fixed a measured freeze.
- **`fixed` positioning on mobile:** the mobile page scrolls inside `.app-scroll-region` (not the window), and `PageMotion` leaves a transform on an ancestor. Do not use `position: fixed` for in-page UI. Use `sticky` or a flex sibling like `MobileBottomNav`. Most visitors arrive through Instagram's in-app browser, so test there.
- **`npm install` warns about blocked install scripts** (`sharp`, `unrs-resolver`). Both work from prebuilt binaries, so the warning can be ignored.
- **No route-level guards:** middleware only refreshes the session. Every new owner-only page, route, or Server Action must call `requireOwner()` or `getOwnerSession()` from `lib/auth.ts`.
- **Stopping a background `npm run dev` from the agent tool can orphan the Next server** (`node …next/dist/server/lib/start-server.js`). The next start then silently moves to port 3001 while tests keep hitting the stale server on 3000. The symptom was a hydration mismatch where the SSR HTML lacked a just-edited change. Before restarting, check `netstat -ano | grep :3000`, stop the leftover node PIDs whose command line is this repo's `next`, and clear `.next` if a stale chunk persists.
- **Migrations are manual.** Anything in `supabase/migrations/` must be pasted into the Supabase SQL Editor by a human. State in your entry whether yours has been applied.

### 2.6 Local development (set up 2026-10-27)

Local Supabase runs in Docker through the Supabase CLI (`npx supabase`). The CLI is not a project dependency, and there is no seed file yet.

1. Start **Docker Desktop**. It does not start with Windows unless the user enables that.
2. Run `npx supabase start` from the repo root. It applies `supabase/migrations/001–018` automatically.
3. Run `npm run dev` and open http://localhost:3000.
4. Stop everything with `npx supabase stop`. Data persists between runs. To rebuild the database from migrations, run `npx supabase db reset`.

Local URLs:

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:54321 |
| Studio (database UI) | http://127.0.0.1:54323 |
| Mailpit (catches auth emails) | http://127.0.0.1:54324 |

Configuration:

- **`supabase/config.toml`:** `site_url = "http://localhost:3000"`, with `additional_redirect_urls = ["http://localhost:3000/**"]`. The wildcard is needed because the password-reset callback URL-encodes `next=`. Email confirmations are **on** (as in production), and the confirmation and recovery emails use the repo's `supabase/email-templates/*.html`. Sender is "NailsByGabs" `<hello@nailsbygabs.local>`. To pick up config changes, run `npx supabase stop`, then `npx supabase start`.
- **`.env.local`** (git-ignored) holds:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (the legacy JWT keys from `npx supabase status -o env`)
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
  - `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`
  - `DEV_MAILPIT_URL=http://127.0.0.1:54324`: booking emails go to Mailpit's send API instead of Resend. Ignored when `NODE_ENV=production`.
  - `CRON_SECRET`, for manually calling `/api/cron/appointment-lifecycle` with `Authorization: Bearer …`

  Resend and Google are left unset.
- **All email lands in Mailpit** (http://127.0.0.1:54324): Supabase auth emails and the app's booking, cancellation, and reminder emails.

Accounts:

- **Owner:** sign up as `gabs@example.com`, then confirm through the Mailpit email. Migration 001 seeds that address as `app_config.owner_email`, so the signup trigger assigns the owner role.
- **Clients:** any other email.

**Norton antivirus on the user's machine intercepts HTTPS.** `NODE_EXTRA_CA_CERTS` points to Norton's certificate. Effects:

- Turbopack's Rust-based fetcher ignores that variable, so Google Fonts fail in `next dev --turbopack` unless the `USE_SYSTEM_TLS_CERTS` flag above is set.
- npm intermittently fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Retry it; do not disable `strict-ssl`.

### 2.7 Upcoming work (owner meeting 2026-10-25)

The user is meeting Gabs on 2026-10-25. Expected inputs and what each one touches:

| Item | What to collect | Where it lands |
|------|-----------------|----------------|
| **Rebrand / new logos** | **Logo delivered and integrated 2026-10-27:** supplied pink PNG is active for browser icons and Instagram/iMessage-compatible share previews. Desktop nav remains text by owner request. Brand colors/fonts and static Supabase email-template restyling remain separate future inputs if desired | `public/branding/`, `layout.tsx` metadata icons, `opengraph-image.tsx` / `twitter-image.tsx` |
| **New photos** | **Completed 2026-10-27**: 40 nail sets plus the About photo were added and optimized; Gabs's reviewed metadata was exported and applied in production | Defaults in `src/lib/portfolio.ts`; production overrides in `portfolio_photos` |
| **Bio (maybe)** | Final text | `src/lib/data.ts` (`aboutContent.bio`) |
| **Loyalty program** (new feature, visible to clients) | Rules: reward and threshold (e.g. every Nth completed appointment), whether manual/offline bookings count, how rewards are redeemed and marked used, expiry, where clients see progress | See design notes below |

**Loyalty program design notes.**

*Data that already exists:*
- `profiles.appointments_completed` is a counter maintained by `mark_completed_appointments()`.
- `booking_events` has a per-client `completed` history.
- Completion only happens through the daily cron, after a 24-hour grace period.

*Gaps:*
- Manual bookings (`booked_name`, no `booked_by`) are not linked to a client account, so they would not count unless the owner can attach a booking to a client.
- Since migration 013, clients can read their own `profiles` row, which makes a "your progress" card on `/book` straightforward.
- Redeeming rewards needs new state, probably a `loyalty_redemptions` table plus an owner action on `/clients`.
- Clients must not be able to write any of this. Use security definer RPCs or owner-only writes, following the existing booking pattern.

**Confirmed by the user (2026-10-27):**
- Loyalty is a per-account **membership flag**; not every client is a member.
- Gabs turns membership on and off from the **Clients page**.
- It must be **visible to clients** in some form.

**Built 2026-10-27 (Claude 1):**
- the membership flag, the owner toggle with a welcome email on joining, and a members-only `/loyalty` page plus nav tab
- the real perks (physical punch card, 20th-birthday 20% off, members-only times that open to all 24h before)

The punch card and birthday coupon are offline (no site tracking or birthday collection, by the user's choice). The questions below are mostly answered by that; revisit them only if digital tracking is requested.

**Open questions to ask before building.** The user has the details and will come back to this; ask these, don't assume:
1. **Reward:** what members get (discount, free add-on, every Nth set free, …).
2. **Earning:** what counts. Completed appointments only? Do manual/offline bookings count?
3. **Redeeming:** is a reward marked used by Gabs or applied automatically? Keep a redemption history?
4. **Client view:** what clients see (progress card on `/book`, badge, other). Do non-members see the program exists?
5. **Membership changes:** when Gabs removes someone, is progress kept or reset? Per-member notes for Gabs?
6. **Notifications:** email on joining, or on earning a reward?
7. **Visibility:** are there cases where the flag or progress should be hidden from the client?

---

## 3. Log

<!-- Newest entries first. Use the template in §1.6. -->

### [Claude 1] — 2026-10-27 20:50 EDT — Pre-commit production build check: passed

**Commits:** none. The user will commit and push to production after this.

**Steps:**
1. Stopped the dev server and confirmed no orphaned `next` node processes and nothing listening on :3000.
2. Ran `npm run build` with CI's placeholder env (`NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key`, `NEXT_PUBLIC_SITE_URL=https://nailsbygabs.org`).
3. Restarted the dev server.

**Result:** exit 0, compiled successfully, all 22 routes generated.
- New routes are present: `/cuticle-oil`, `/loyalty`.
- `/opengraph-image` and `/twitter-image` are static.

**Warning:** the single warning is pre-existing and comes from a library. `@supabase/supabase-js` uses `process.version`, which is unsupported in the Edge Runtime. It is pulled in through `@supabase/ssr` by `src/lib/supabase/middleware.ts`, which is unchanged since `357d72a`.

Lint and typecheck were already clean.

**Production follow-up (user):** after deploying, run `017_cuticle_oil_and_loyalty.sql`, then `018_members_only_slots.sql`, in the Supabase SQL Editor.

### [Claude 1] — 2026-10-27 20:41 EDT — Share-preview card: logo lettering moved to the vertical center

**Commits:** none (the user commits).

**Files:** `src/app/opengraph-image.tsx`. `twitter-image.tsx` re-exports it, so both previews change.

**Request:** move "Nails By Gabs" (above "GELX NAILS") down toward the middle of the link-preview card. The user also decided **not** to change the favicon; leave `NailsByGabsIcon.png` as is.

**Why it sat high:**
- `public/branding/NailsByGabsLogo.png` is 1513×1001, but the lettering only fills rows 53–555 (measured with sharp). The bow hangs below it to row 952.
- The old flex layout centered the *whole image*, which put the lettering's center around y≈200 of 630.
- Shifting the 720px-wide image down would have pushed the bow past the card's bottom edge.

**Change:**
- The layout is now computed from those measured bounds (`LOGO_SOURCE` constants) with absolute positioning inside the white card.
- The **lettering plus a 24px gap plus the "GELX NAILS" tagline** are centered as a group. The logo is 660px wide (was 720) so the bow still fits.
- The bow hangs to the right of the tagline. The image stays horizontally centered, as before.
- If the logo file is ever replaced, re-measure `letteringTop`/`letteringBottom`.

**Verified:**
- `/opengraph-image` and `/twitter-image` return 200 `image/png`.
- In the rendered PNG the strong-pink ink spans y 173–567, inside the card (32–598), with nothing clipped. The screenshot was checked.
- `tsc --noEmit` and `npm run lint` are clean.

**Note:** Instagram, iMessage, and Facebook cache link previews, so already-shared links may show the old card for a while. Facebook's Sharing Debugger can force a refresh.

### [Claude 1] — 2026-10-27 20:21 EDT — Punch card image on the Loyalty page (optimized, metadata stripped)

**Commits:** none (the user commits).

**Files:**
- New: `public/loyalty/LoyaltyPunchCard.webp`
- New (git-ignored): `image-originals/loyalty/LoyaltyPunchCard.png`
- Edited: `src/app/loyalty/page.tsx`, `docs/PROJECT_ARCHITECTURE.md`

**What the user asked for:** add Gabs's PNG of the physical punch card to the Loyalty page, below the title and description and above the perk boxes. Run it through the optimize and metadata-strip script and put the files in the right folders.

**Image handling:**
- **Input:** the user dropped `public/portfolio/Copy of Loyalty Card - 2.png` (600×1050 RGB PNG, 390 KB, with **EXIF and XMP metadata**).
- **Original:** moved and renamed (no spaces) to the git-ignored `image-originals/loyalty/LoyaltyPunchCard.png`, so nothing is left in `public/portfolio/`.
- **Web copy:** ran `npm run images:optimize -- image-originals/loyalty --out public/loyalty --quality 90`, producing `public/loyalty/LoyaltyPunchCard.webp` (600×1050, 68 KB, 83% smaller).
  - Quality 90 instead of the default 80 because the card is mostly lettering.
  - It is not upscaled; the script's `withoutEnlargement` keeps it at 600px.
- **Verified:** sharp reports no EXIF/XMP/ICC/IPTC, and the file contains no `EXIF`/`XMP `/`ICCP` chunks.
- **Not a gallery photo:** the script's "register in portfolio.ts" hint does not apply.

**Page:**
- A `next/image` in its own `ScrollReveal` between the intro and the perk grid.
- Settings: `width={600} height={1050}`, `sizes="(min-width: 640px) 320px, 80vw"`, `quality={90}`, `max-w-xs` from `sm` up and `max-w-[80vw]` on phones.
- Centered, with a rounded accent border and descriptive alt text.
- The browser picks the 640w candidate, which is served at the source's 600px.

**Note:** files in `public/` are reachable by URL without signing in. The page is members-only, but the image itself is not secret; it shows Gabs's public Instagram, email, and site.

**Testing:** headless Chrome as a temp member (deleted afterwards) at 1280, 960, and 390 (mobile).
- The image loads and sits below the intro `h2` and above the first perk card.
- It is centered (equal gaps) with no sideways scroll.
- Screenshots checked.
- `tsc --noEmit` and `npm run lint` are clean.

### [Claude 1] — 2026-10-27 19:58 EDT — Loyalty perks, members-only appointment times (migration 018), single cuticle oil price

**Commits:** none (the user commits). **Migrations 017 (revised) and 018 are applied locally, NOT in production.**

**Files:**
- New: `supabase/migrations/018_members_only_slots.sql`, `src/lib/members-only.ts`
- Edited:
  - `supabase/migrations/017_cuticle_oil_and_loyalty.sql`
  - `src/types/database.ts`, `src/lib/cuticle-oil.ts`, `src/lib/cuticle-oil-limits.ts`, `src/lib/notifications.ts`
  - `src/app/book/page.tsx`, `src/app/book/actions.ts`
  - `src/components/booking/booking-calendar.tsx`, `src/components/booking/appointment-calendar-grid.tsx`
  - `src/app/cuticle-oil/page.tsx`, `src/app/cuticle-oil/actions.ts`
  - `src/components/cuticle-oil/cuticle-oil-menu.tsx`, `src/components/cuticle-oil/cuticle-oil-editor.tsx`
  - `src/app/loyalty/page.tsx`
  - `docs/PROJECT_ARCHITECTURE.md`

**The program, as the user supplied it (Gabs's rules):**
- **Punch card:** physical, with a punch per appointment. Every 9th punch is 15% off that set.
- **Birthday:** "turning 20? 20% off a set". The user confirmed this is **only the 20th birthday**, not age-scaled. The coupon is sent by Instagram DM and expires 6 months out. The site does **not** collect birthdays; Gabs tracks them herself.
- **Booking priority:** members-only appointment times. Gabs flags open slots at creation and can toggle the flag later in the edit dialog.
  - Non-members see them **locked**.
  - They **open to everyone 24 hours before** the start.
  - Members are **not emailed** when such times are posted.
- **Perks text is fixed** in code (`PERKS` in `src/app/loyalty/page.tsx`), not owner-editable.
- **Cuticle oil:** one size, a **30 ml bottle**, at $12. The price list editor is replaced by a single editable price field. The size text is the constant `CUTICLE_OIL_SIZE` in `cuticle-oil-limits.ts`.

**Database:**
- **017, revised in place.** It was uncommitted and never run in production, so editing it was safe.
  - `cuticle_oil_prices` is gone.
  - New `app_config` key `cuticle_oil_price` is seeded with `$12` and publicly readable.
  - The owner update policy is now **"Owner can update cuticle oil settings"**, covering both keys: price 1–20 characters; link `''` or https up to 500 characters. The old policy name is dropped too.
  - Locally: dropped the (empty) `cuticle_oil_prices` table and re-ran 017, which is idempotent.
- **018.**
  - Adds `appointment_slots.members_only boolean not null default false`.
  - `create or replace` of `book_appointment_slot` (012's body plus a member check):
    - Non-members get `This time is reserved for loyalty members until 24 hours before the appointment.` while `members_only and start_at > now() + 24h`.
    - The UPDATE's WHERE clause repeats the condition, so the check is atomic.
  - Requires 017's `profiles.loyalty_member`. Existing grants carry over with `create or replace`.

**App:**
- **Shared rule.** `src/lib/members-only.ts` provides `isMembersOnlyActive(slot)` (open, flagged, more than 24h out) plus `formatMembersOnlyOpensAt()` (Eastern). The UI uses it; the RPC is the authority.
- **Pre-018 safety:**
  - `/book` selects `*` with the booker embed, mapping `members_only`.
  - `createSlot` sends `members_only` only when checked. `updateSlot` reads `*` and writes the flag only when it changed on an open slot.
  - Writing the column before 018 returns "Members-only times need database migration 018."
- **Owner calendar:**
  - The create form has a "Loyalty members only" checkbox, disabled for pre-booked slots; the button reads "Add members-only slot".
  - The edit dialog has a toggle for open slots. Booked slots keep their flag, so it applies again if the booking is released or cancelled.
  - Chip label "Open · members only"; the selected card says "Members only until <time>, then open to everyone."
- **Clients:**
  - The chip label is "Members only" with a dashed accent border; non-members also see it dimmed.
  - Non-members clicking it get no booking dialog and no Reserve button. The selected card shows a lock and "Reserved for loyalty members. It opens to everyone <time>."
  - The mobile "Book next available spot" skips locked slots.
  - The `/book` intro explains the rule, worded differently for members and non-members.
- **Loyalty page:**
  - Three perk cards (Punch card / Birthday discount / Booking priority) in a centered `max-w-4xl` grid, 3 columns at `lg` with matched heights.
  - A "See open times" button for members.
- **Welcome email:** now lists the three perks.
- **Cuticle oil:**
  - `getCuticleOilPage()` returns `price` (from `app_config`) instead of `prices`.
  - `setCuticleOilPrice` replaces the three price-row actions.
  - The visitor Price card shows the big price plus "30 ml bottle". The page's empty state now depends on scents only.
  - The copy no longer mentions choosing a size.
  - In the owner editor, the Price card is `md:self-start` so it doesn't stretch to the Scents card's height.

**Testing:** headless Chrome plus supabase-js RPC calls, scratchpad `cdp-members.mjs` and `cdp-oilprice.mjs`, with a temp owner, client, and member (all deleted). **24/24 passed:**
- RPC:
  - a non-member is blocked more than 24h out, and the slot stays open
  - a non-member can book under 24h out
  - a member can book more than 24h out
- Owner UI:
  - the members-only checkbox creates a flagged slot
  - chip label and opens-at text are correct
  - the edit toggle switches the flag off and on
  - the price saves
- Non-member UI: "Members only" chip, no dialog, lock message, no Reserve, intro copy.
- Member UI: the booking dialog opens and the booking succeeds; the perks show on `/loyalty`; mobile has no sideways scroll.
- Email: the welcome email lists the perks.
- Oil: the visitor sees $12 and the 30 ml bottle; the owner field shows $12.

Test slots and their `booking_events` rows were deleted, and the price was reset to `$12`. The snapshot otherwise matches (`users=2 slots=1 photo_rows=40 services=14 events=10`, 0 scents).

**Note for the user:** `client1@example.com` became a loyalty member at 19:03 EDT through the Clients page (a welcome email to that address is in Mailpit at the same second). No test script touches that account, so it was presumably the user testing in their own browser. It was left as is.

`tsc --noEmit` and `npm run lint` are clean.

**Production order:** 017, then 018, in the Supabase SQL Editor. Either can follow the deploy.

### [Claude 1] — 2026-10-27 19:12 EDT — Centered Services/Cuticle Oil/Loyalty, split-screen-friendly nav, About glow removed

**Commits:** none (the user commits).

**Files:**
- New: `src/components/owner-menu.tsx`
- Edited:
  - `src/app/about/page.tsx`, `src/app/globals.css`, `src/lib/nav.ts`
  - `src/components/desktop-nav.tsx`, `src/components/mobile-bottom-nav.tsx`
  - `src/app/services/page.tsx`, `src/components/services/services-menu.tsx`
  - `src/app/cuticle-oil/page.tsx`, `src/components/cuticle-oil/cuticle-oil-menu.tsx`, `src/components/cuticle-oil/cuticle-oil-editor.tsx`
  - `src/app/loyalty/page.tsx`
  - `docs/PROJECT_ARCHITECTURE.md`

**What the user asked for:**
1. Remove the About contact-card glow too (confirming that `.spotlight-card` was the glow they meant).
2. Center the content of the price list, loyalty, and cuticle oil pages at full screen, and make the pages behave well in non-maximized (split-screen) windows.

**Changes:**
- **Glow:** dropped `spotlight-card` from the About card. With no users left, the `.spotlight-card` rules were deleted from `globals.css`.
- **Centering:** on all three pages the intro and the card block share one centered column (`mx-auto w-full max-w-4xl`; Loyalty uses `max-w-3xl`).
  - The intro text is centered, including the kicker, `h2`, `mx-auto` paragraph, Order button, and Member-since pill. Card contents stay left-aligned.
  - Paired cards (oil Prices/Scents, service categories) now match heights. `ScrollReveal` wraps children in `.scroll-reveal-inner`, so the reveal gets `[&>.scroll-reveal-inner]:h-full` and the card `h-full`.
- **Split-screen nav:** the measurements showed the real split-screen problem was the desktop bar. At 960px a member's "Loyalty" tab was clipped ("Loya") by the row's hidden scroll, and the owner's ten tabs overflowed at anything under about 1300px. The desktop bar now:
  - shows short labels below `xl` (the owner's below `2xl`)
  - uses `px-3` tabs and a `text-xl` wordmark below `lg`, and tighter header gaps and padding below `lg`
  - folds the owner's Loyalty and owner pages into an "Owner ▾" dropdown below `xl`
- **Shared menu:** the dropdown logic moved out of `mobile-bottom-nav.tsx` into `components/owner-menu.tsx`, with caller-supplied trigger and panel position. The desktop menu is placed outside the `overflow-x-auto` row so it isn't clipped. `OWNER_MENU_NAV` was added to `nav.ts`.
- **Owner price editor:** each `services-menu` row was a single `1fr auto auto` row, which squeezed service names to two or three lines in half-width cards (in full screen too). Rows now stack: the name on its own line, then `grid-cols-[7rem_1fr]` Price + Note.

**Testing:** headless Chrome via CDP, scratchpad `cdp-center.mjs`, `cdp-navwidth*.mjs`, and `cdp-owner-shots.mjs`, with temp accounts (since deleted).
- **Centering:** all three pages at window widths 1920, 1280, 960, and 800 have equal left and right gaps for both the intro and the cards, and no sideways scroll.
  - At 700 the phone layout applies. The inner scroll region's 15px desktop scrollbar makes the gaps read as 16/31; this is a measurement artifact.
- **Desktop bar:** checked visitor, member, and owner at 790, 800, 850, 960, 1300, and 1600. There were 0 clipped tabs and no header overflow, and the owner dropdown appears exactly below `xl`.
  - The dropdown lists Loyalty, Stats, Clients, Photos, Theme. It stays on screen, navigates and closes, and the Owner tab highlights on owner pages.
  - Note that a 1280px window is about 1247px of viewport after the scrollbar, so it still shows the dropdown.
- **Mobile owner menu:** still works after the refactor.
- **Owner editors:** `/services` and `/cuticle-oil` at 960 and 1920 have no sideways scroll, and screenshots look right.
- **Data:** the snapshot is unchanged (`users=2 slots=1 photo_rows=40 services=14 events=10`, oil tables empty, link `''`, 0 members).
- `tsc --noEmit` and `npm run lint` are clean.

### [Claude 1] — 2026-10-27 18:52 EDT — Removed card glow on Services & Pricing, Cuticle Oil, and Loyalty (owner request)

**Commits:** none (the user commits).

**Files:**
- `src/components/services/services-menu.tsx`
- `src/components/cuticle-oil/cuticle-oil-menu.tsx`
- `src/components/cuticle-oil/cuticle-oil-editor.tsx`
- `src/app/loyalty/page.tsx`

**Change:** dropped the `spotlight-card` class from the cards on these three pages.

- `.spotlight-card::before` in `globals.css` paints a 420px accent radial gradient (24% `--accent`) behind the card content. It fades in on `:hover` and `:focus-within`.
- Nothing sets `--spot-x/--spot-y`, so it is a fixed glow at the card's top center. It also lit up whenever the owner typed into an editor field.
- The cards keep their border, `bg-card/90`, shadow, and blur.
- The class and its CSS remain for the About page contact card, the only other user, which the user did not mention.
- The Halloween bottom fog (`.halloween-fog`) is a separate, site-wide effect and is unchanged.

### [Claude 1] — 2026-10-27 18:41 EDT — Cuticle Oil page (owner-editable) and members-only Loyalty page (migration 017)

**Commits:** none (the user commits). **Migration 017 is applied locally, NOT in production.**

**Files:**
- New:
  - `supabase/migrations/017_cuticle_oil_and_loyalty.sql`
  - `src/lib/cuticle-oil.ts`, `src/lib/cuticle-oil-limits.ts`
  - `src/app/cuticle-oil/page.tsx`, `src/app/cuticle-oil/actions.ts`
  - `src/components/cuticle-oil/cuticle-oil-menu.tsx`, `src/components/cuticle-oil/cuticle-oil-editor.tsx`
  - `src/app/loyalty/page.tsx`
- Edited:
  - `src/types/database.ts`, `src/lib/auth.ts`, `src/lib/clients.ts`, `src/lib/notifications.ts`, `src/lib/nav.ts`
  - `src/app/clients/actions.ts`, `src/components/clients/clients-list.tsx`
  - `src/components/desktop-nav.tsx`, `src/components/mobile-bottom-nav.tsx`, `src/app/layout.tsx`
  - `docs/PROJECT_ARCHITECTURE.md`

**What the user asked for (with the answers to clarifying questions):**
- A public Cuticle Oil page with Google Form ordering, prices, and available scents.
  - Gabs edits the scents (add, rename, remove, sold out) and a single price list (same for every scent) **inline on the page**.
  - She pastes the form link herself. Until then the page says "Ordering opens soon".
- A Loyalty page only for clients flagged as members (off by default). Gabs toggles membership in the client list.
  - The client is emailed when added; nothing is sent on removal.
  - Perks content will come from the user later, so the page is a placeholder for now.
- Both pages as nav tabs. On mobile the owner pages fold behind one "Owner" item.

**Migration 017:**
- **Tables.** `cuticle_oil_scents` and `cuticle_oil_prices`:
  - length checks match the app limits (40/40/20)
  - RLS: public `select` for anon and authenticated; owner-only `all` via `is_owner()`
- **Order link.** `app_config` key `cuticle_oil_order_url` (seeded `''`):
  - added to the public-read policy (recreated with the three theme keys)
  - owner-only update policy whose `with check` allows only `''` or `^https://` up to 500 chars
- **Profile columns.** `profiles.loyalty_member boolean not null default false` and `loyalty_member_since timestamptz`.
- **Security fix bundled in.** `revoke update on profiles from anon, authenticated; grant update (full_name) on profiles to authenticated`.
  - Before this, 001's "Users can update own profile name" policy allowed a client to update any column of their own row.
  - With a membership flag that would let them self-grant loyalty. They could already edit `appointments_booked`/`appointments_completed`.
  - Security definer functions and the service role are unaffected.
- **`set_loyalty_member(p_client_id, p_member) returns boolean`.** Security definer, owner-only, client rows only (`for update` lock).
  - Sets or clears `loyalty_member_since`.
  - Returns true only on a false→true change, which is the app's cue to send the welcome email (so re-saving never re-sends).
  - Executable by authenticated only.
- **Verified in a rolled-back transaction:**
  - clients can't self-grant, edit counters, call the RPC, insert scents, or change the link (they can still edit their name)
  - owner RPC returns true then false
  - non-https link rejected
  - anon reads scents, prices, and the link

**App code:**
- **Pre-migration safety:**
  - `getSessionProfile()` and `listOwnerClients()` now `select("*")`, so the new columns can't break sign-in or the client list if code ships before 017.
  - `OwnerClientRow.loyaltyAvailable` (`"loyalty_member" in profile`) disables the toggle until then.
  - `getCuticleOilPage()` returns `ready:false` on `PGRST205`/`42P01`.
- **Cuticle oil:**
  - Server actions all start with `getOwnerSession()` (RLS is the real gate) and validate with the shared limits.
  - New rows get `max(sort_order)+1`.
  - The order link must parse as an `https:` URL. The update uses `.select()` to detect "0 rows" (migration missing).
  - The reader also re-validates the stored URL before rendering it. The link opens with `target=_blank rel="noopener noreferrer"`.
  - Visitors see price rows, scent chips (sold out = struck through, with sr-only text), and an "Order now" button in the intro and in a "How to order" card.
  - The owner sees the same three cards as forms (`useActionState` per row, confirm before Remove).
  - **The intro and "How to order" sentences are my draft copy; the user should review them.**
- **Loyalty:**
  - `canSeeLoyalty()` in `lib/auth.ts`.
  - `/loyalty` redirects everyone else to `/`. Signed-out visitors get the streaming `NEXT_REDIRECT` (307) like other gated pages because of `app/loading.tsx`.
  - Members see "Welcome, <first name>", a "Member since <Month YYYY>" pill (Eastern), and a placeholder "Your perks" card. The owner sees an explanatory note.
  - `setLoyaltyMembership` calls the RPC and then `notifyClientOfLoyaltyMembership(clientId)`. That reads the email through `admin.auth.admin.getUserById`, uses the themed `buildEmailHtml` (which gained an optional `ctaPath`; the button opens `/loyalty`), and never throws.
  - The client list shows a "Loyalty member" badge and a "Make loyalty member" / "Remove from loyalty" button.
- **Nav:** see the §2.3 rows (Oil tab for everyone, Loyalty for members, owner menu on mobile, compact owner labels on desktop).

**Testing:** headless Chrome via CDP, scratchpad `cdp-oil-loyalty.mjs`, with temp owner and client accounts. **31/31 checks passed:**
- visitor: nav, empty state, `/loyalty` → `/`
- owner:
  - add 2 prices and 3 scents (order kept, add form resets)
  - rename + sold out, edit a price, remove with confirm
  - http link rejected, https link saved
- loyalty toggle:
  - flag set, welcome email in Mailpit with a `/loyalty` link, badge shown
  - removal sends no email; re-adding works
- member: desktop tabs, visitor view (link, struck-through sold-out scent, prices), `/loyalty` content, mobile bar
- owner mobile:
  - bar shows 6 items; the menu lists 5 and stays on screen
  - tapping a link navigates and closes it; an outside tap closes it

Desktop tab fit was measured: it fits at 1280 and 1536, and the owner's row scrolls at 1024 (it already overflowed there before). Fixed during testing:
- the translucent owner menu let the Book CTA show through (now `bg-background`)
- the owner tabs overflowed at 1280 (now compact labels)

A hydration mismatch seen mid-test was an **orphaned dev server** serving stale code (see §2.5). It was fixed by killing the stray PIDs and clearing `.next`, after which all checks re-passed. Cleanup:
- temp accounts deleted; oil rows cleared; link reset to `''`
- the snapshot matches the earlier counts (`users=2 slots=1 photo_rows=40 services=14 events=10 theme=halloween`, 0 members)

`tsc --noEmit` and `npm run lint` are clean.

**Next steps / handoff:**
- Production: run **017** in the Supabase SQL Editor (safe before or after deploying).
- Gabs then adds her scents and prices on /cuticle-oil and pastes the Google Form link.
- The loyalty perks content is pending from the user. It currently lives as static text in `src/app/loyalty/page.tsx`.
- The user originally chose "perks text Gabs writes". If they still want her to edit it, add an `app_config` key or table and an inline editor like the oil page.
- Still offered and awaiting the user's go-ahead: a square favicon mark and an OG card layout.

### [Claude 1] — 2026-10-27 16:40 EDT — Local environment shut down (data preserved)

**Commits:** none; no project files changed apart from this entry.

**What was done:**
1. Recorded a database snapshot: `users=2 slots=1 photo_rows=40 services=14 events=10 theme=halloween`.
2. Stopped the dev server on :3000 (PID 18996, a node process left running by Codex 1).
3. Ran `npx supabase stop` **without `--no-backup`**. The result reported `"backup": true`, 0 containers remained, and the `supabase_db_NailsByGabs`, `supabase_storage_NailsByGabs`, and `supabase_edge_runtime_NailsByGabs` volumes were kept.
4. Quit Docker Desktop and ran `wsl --shutdown`; the `docker-desktop` distro shows Stopped.

**To resume:** start Docker Desktop, run `npx supabase start`, then `npm run dev`. Re-run the snapshot query and compare it with the counts above to confirm persistence. Never use `npx supabase stop --no-backup` or `npx supabase db reset` without the user's go-ahead, because both wipe local data, including the owner's 40 reviewed photo rows.

### [Claude 1] — 2026-10-27 16:36 EDT — About photo: blur fixed, zoomed out to 4:3, full-resolution metadata-stripped source

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- `src/components/effects/profile-card.tsx` (new optional `sizes` and `quality` props)
- `src/app/about/page.tsx`
- New: `public/about/NailsByGabsAbout.webp`; removed `public/about/NailsByGabsNewAbout.webp` (Codex's 2000px copy, never committed)
- Original renamed in the ignored folder: `image-originals/about/NailsByGabsNewAbout.JPEG` → `NailsByGabsAbout.JPEG`
- Docs: `docs/PROJECT_ARCHITECTURE.md`, `AGENTS.md` (§2.3 Brand assets row)

**Technical explanation**

*Problem.* The user saw an "extreme quality drop" on the About photo and asked to recrop, zoom out, and use a full-resolution metadata-stripped image.

*Root cause* (measured from the rendered `srcset`):
- `ProfileCard` hard-coded `sizes="(max-width: 1024px) 100vw, 480px"`, but the card was a 4:5 portrait box cropping a 3:2 landscape photo with `object-cover`. The image must cover the card's **height**, so it needs about 1.9× the card's width, while `sizes` only described the width.
- Browsers therefore fetched width-sized variants (1080w on desktop @2x, 1200w on iPhone @3x) and stretched them 2.3× and 1.7×.
- The 2000px source capped quality further.

*Fix:*
- **Source:** `sharp(original).rotate().webp({ quality: 92, effort: 6, smartSubsample: true })` at the native 6000×4000, 2.3 MB. The source was already sRGB with no ICC profile, so stripping metadata cannot shift colors; EXIF, XMP, and IPTC are gone. This is a deliberate exception to the 2000px rule, because next/image only uses the file as an optimizer source and serves resized variants.
- **Shape:** the card is 4:3 (the user chose it from rendered 4:5, 1:1, 4:3, and 3:2 previews), showing about 89% of the photo's width. That's the "zoom out", and the whole head is now visible on desktop. `imagePosition` stays at `52% 50%`. The old `max-h-[520px] lg:max-h-none` was removed because 4:3 is short enough everywhere.
- **Size hint:** `sizes="(min-width: 1024px) 55vw, 105vw"`. The card is about 46vw on lg+ and ~92vw on mobile, ×1.125 to cover a 4:3 box with a 3:2 image.
- **Quality:** `quality={90}`.
- **`ProfileCard`:** its default `sizes` is unchanged, and `cn`/tailwind-merge lets `aspect-[4/3]` override the default `aspect-[4/5]`.

**Verification**
- Headless Chrome; stretch = device px per downloaded image px (≤1 is sharp):

  | Viewport | Card | File picked | Stretch |
  |----------|------|-------------|---------|
  | Desktop 1440 @2x | 664×498 | 1920w q90 | **0.78×** |
  | iPhone 15 @3x | 361×271 | 1920w q90 | **0.63×** |

  Before: 2.3× and 1.7× upscaled. The first version of the measurement wrongly used `naturalWidth`, which is density-corrected for `srcset` images; it was corrected to the real width of the downloaded file.
- Screenshots: full head, brush, bottle, and nails crisp on both. The face softness is the photo's own depth of field.
- Image audit: About 1 web ↔ 1 original (names match); `NailsByGabsAbout.webp` has no metadata. Its "OVERSIZE" flag is the intended exception.
- `npm run lint` and `npm run typecheck`: pass. No references to `NailsByGabsNewAbout` remain in `src`.

**Open items / handoff**
- If the gallery or carousel are ever shown in shapes other than their current tiles, apply the same `sizes` rule. Today they use portrait photos in portrait or square boxes, which aren't affected.

### [Claude 1] — 2026-10-27 16:28 EDT — Review of Codex 1's work, then image-archive audit and tidy-up

**Commits:** uncommitted. Only git-ignored files changed in this entry; the user still needs to commit Codex 1's changes.
**Files touched:**
- Moved `image-originals/about/NailsByGabsAboutPhoto.JPEG` → `image-originals/retired/`
- Restored `image-originals/retired/Nails by Gabs (old logo).png` from `HEAD` (it had been deleted from `public/branding/`)

**Technical explanation**

*Review of Codex 1's five entries (15:57–16:23).* Reviewed read-only at the user's request. Diffs matched the log: architecture-doc reconciliation, single lightbox close (`DialogContent` `showCloseButton`), About glare removed, new logo icons and OG card, new About photo, assets optimized. Lint and typecheck pass; no references to deleted assets remain.

During the review, the OG and Twitter routes reset the connection 3 out of 3 times while the logo was WebP (Satori can't decode WebP data URIs). Codex switched it to PNG at 16:22 and logged it; after that, both routes return a 1200×630 PNG.

Follow-ups reported to the user (not changed):
- 32px favicon of the wide wordmark is illegible; a square mark is needed.
- On desktop, the About crop `52% 50%` cuts off the top of her head.
- The new About photo has her face in soft focus (content call).
- The OG card layout leaves a large gap below the logo.

*Image audit* (script over every image outside `node_modules`/`.next`):
- **Locations:** no images outside `public/` and `image-originals/`, and no raw JPEG/HEIC in `public/`.
- **Portfolio:** 81 WebP ↔ 81 originals, a 1:1 match.
- **Metadata:** all 84 public images have no EXIF, ICC, IPTC, or XMP, and none exceeds a 2000px long edge.
- **References:** every file referenced in code exists. (`NailsByGabsLogo.png` is used through a `join(…)` path in `opengraph-image.tsx`.)
- **Git:** `image-originals/` is ignored, with 0 tracked files.

**Photoshoot accounting** (matched by byte size and timestamp):

| File | Status |
|------|--------|
| Gabby Nails-07, 17, 25, 27, 29 | in `image-originals/photoshoot/` |
| Gabby Nails-14 | renamed by the user to `NailsByGabsNewAbout.JPEG` (current About photo) |
| Gabby Nails-16 | renamed to `NailsByGabsAboutPhoto.JPEG` (previous About photo; now in `retired/`) |

**Archive layout now** (`image-originals/`, git-ignored):
- `portfolio/` (81)
- `about/NailsByGabsNewAbout.JPEG`
- `branding/NailsByGabsLogo.png` (cropped working copy) and `branding/source/NailsByGabsLogoSource.png` (untouched supplied logo)
- `photoshoot/` (5 unused)
- `retired/`: `HeadshotGabrielle.jpeg`, `NailsByGabsAboutPhoto.JPEG`, `Nails by Gabs (old logo).png`
- `review/` (tag review sheets)

**Verification:** the audit was re-run after the moves. About is 1 web copy ↔ 1 original, portfolio 81 ↔ 81, all public images clean, and `git status -- image-originals` is empty.

**Open items / handoff**
- The user should commit Codex 1's work. Pending in `public/`: deletion of the old About WebP and the old logo PNG; new `NailsByGabsNewAbout.webp`, `NailsByGabsIcon.png`, `NailsByGabsLogo.png`.
- The favicon, About crop, and OG layout follow-ups above are awaiting the user's go-ahead.

### [Codex 1] — 2026-10-27 16:23 EDT — New About portrait and logo assets compressed with metadata removed

**Commits:** uncommitted
**Files touched:**
- About: `src/app/about/page.tsx`, new `public/about/NailsByGabsNewAbout.webp`, removed `public/about/NailsByGabsAboutPhoto.webp`
- Branding: optimized `public/branding/NailsByGabsLogo.png`, retained `public/branding/NailsByGabsIcon.png`, removed old `public/branding/Nails by Gabs.png`
- Share image: `src/app/opengraph-image.tsx`
- Raw originals (git-ignored): `image-originals/about/NailsByGabsNewAbout.JPEG`, `image-originals/branding/NailsByGabsLogo.png`, `image-originals/branding/source/NailsByGabsLogoSource.png`
- Docs: `docs/PROJECT_ARCHITECTURE.md`, `AGENTS.md`

**Technical explanation**

The user clarified that the newly added `NailsByGabsNewAbout.JPEG` should replace the About portrait and asked to compress both it and the supplied logo while stripping metadata, following the existing Claude-created Sharp pipeline.

- Moved the 6000×4000, 2.9 MB About JPEG from `public/about/` into git-ignored `image-originals/about/`.
- Ran `npm.cmd run images:optimize -- image-originals/about --out public/about`. The pipeline EXIF-rotated, resized to a 2000px long edge, encoded WebP at quality 80, and stripped metadata. Output: `NailsByGabsNewAbout.webp`, 2000×1333, 62 KB (98% smaller).
- Updated the About card to use the new WebP with `imagePosition="52% 50%"`, selected from a rendered 4:5 crop preview so Gabs, the brush, polish bottle, and nails remain visible.
- Preserved the untouched 2000×2000 logo source under `image-originals/branding/source/` and the cropped working logo under `image-originals/branding/`.
- The standard optimizer produced a 43 KB metadata-free logo WebP (85% smaller), but Next's live `opengraph-image` route returned an empty response when that WebP was embedded as a data URI. Replaced it with a palette-quantized, compression-level-9 PNG: 281 KB → 90 KB (69% smaller), metadata-free, and verified the 1200×630 social card renders again.
- Kept `NailsByGabsIcon.png` as PNG for favicon/Apple compatibility; it was already generated by Sharp at 512×512, 67 KB, with no EXIF/ICC/IPTC/XMP.
- Removed the obsolete public About WebP and old logo PNG. The prior assets remain recoverable from `image-originals/` or Git history.

This entry corrects the 16:15 Codex 1 handoff: raw logo sources now live under `image-originals/`, not `public/branding/`, and the active OG wordmark is the optimized PNG described above.

**Verification**
- Metadata inspection (`sharp.metadata()`): About WebP, logo PNG, and icon PNG have no EXIF, ICC, IPTC, or XMP
- Local `/about`: HTTP 200 and serves `NailsByGabsNewAbout.webp`
- Visual: 4:5 About crop and final 1200×630 Open Graph card inspected
- Local `opengraph-image`: HTTP image response restored after PNG compatibility fallback
- `npm.cmd run lint`: pass
- `npm.cmd run typecheck`: pass

**Open items / handoff**
- None.

### [Codex 1] — 2026-10-27 16:15 EDT — New supplied logo integrated into icons and mobile link-share previews

**Commits:** uncommitted
**Files touched:**
- Assets: `public/branding/NailsByGabsLogoSource.png`, `public/branding/NailsByGabsLogo.png`, `public/branding/NailsByGabsIcon.png`
- Metadata/share UI: `src/app/layout.tsx`, `src/app/opengraph-image.tsx`
- Docs: `docs/PROJECT_ARCHITECTURE.md`, `AGENTS.md`

**Technical explanation**

The user placed `NailByGabsNewLogo.png` in `public/portfolio/` and asked for it to become the active logo, prioritizing Instagram and iMessage link sharing on mobile. The source was moved out of the gallery into `public/branding/NailsByGabsLogoSource.png` and preserved unchanged.

- Generated `NailsByGabsLogo.png` by trimming the source's large white margins and adding a small even white safe area. This derivative is embedded in the 1200×630 `opengraph-image` and re-exported by `twitter-image`, so Open Graph consumers such as iMessage and Instagram receive the new pink logo.
- Generated `NailsByGabsIcon.png` as a 512×512 white-backed square derivative and wired it to the standard favicon, shortcut icon, and Apple touch icon metadata.
- Reworked the generated share card around the supplied pink logo and retained the confirmed tagline `GelX Nails`.
- A first pass placed the graphic in the desktop top-left navigation. The user immediately clarified that this location should remain the original text wordmark, so `DesktopNav` was restored before handoff. No runtime reference to the old `Nails by Gabs.png` remains.
- The old logo file remains in `public/branding/` as an unused historical asset; it is not served by current metadata or share-image code.

No database, theme palette, email template, route, prop, or environment contract changed.

**Verification**
- Visual inspection: source, cropped wordmark, square icon, and rendered 1200×630 Open Graph image checked
- Local `/` metadata: `og:image` and `twitter:image` are 1200×630 PNGs with alt `Nails By Gabs pink wordmark logo`
- Local `/` metadata: favicon, shortcut icon, and Apple touch icon all resolve to `/branding/NailsByGabsIcon.png`
- Runtime search: no source-code references to `Nails by Gabs.png` remain
- `npm.cmd run lint`: pass
- `npm.cmd run typecheck`: pass

**Open items / handoff**
- Social platforms cache link previews. After deployment, use each platform's refresh/debug tooling or wait for cache expiry before judging an already-shared URL.
- A future transparent/vector logo or dedicated square mark can replace the generated derivatives without changing the metadata architecture.

### [Codex 1] — 2026-10-27 16:08 EDT — Removed cursor-following glare from About photo while preserving tilt

**Commits:** uncommitted
**Files touched:**
- UI: `src/components/effects/profile-card.tsx`
- Styles: `src/app/globals.css`
- Shared memory: `AGENTS.md`

**Technical explanation**

The user asked to remove only the light circle that followed the cursor over Gabs's About photo while retaining the card's motion.

- Removed the `.profile-card-glare` overlay element and its radial-gradient CSS.
- Removed the now-unused `--glare-x` and `--glare-y` pointer updates and reset values.
- Preserved the pointer handler, `--tilt-x` / `--tilt-y` variables, perspective transform, transition, border, shadow, mobile behavior, and reduced-motion behavior.

No props, routes, database contracts, migrations, or environment variables changed.

**Verification**
- `npm.cmd run lint`: pass
- `npm.cmd run typecheck`: pass
- `rg`/source inspection: no `.profile-card-glare` or `--glare-*` references remain; tilt variables and transform remain

**Open items / handoff**
- None.

### [Codex 1] — 2026-10-27 16:03 EDT — Removed duplicate portfolio lightbox close control

**Commits:** uncommitted
**Files touched:**
- UI: `src/components/portfolio/portfolio-lightbox.tsx`, `src/components/ui/dialog.tsx`
- Shared memory: `AGENTS.md`

**Technical explanation**

The portfolio lightbox displayed two X buttons because the shared `DialogContent` always injected a Radix close control and `PortfolioLightbox` rendered a second image-overlay close button.

- Added an optional `showCloseButton` prop to `DialogContent`, defaulting to `true`, so every existing dialog retains its current close button unless it explicitly opts out.
- Set `showCloseButton={false}` only for `PortfolioLightbox` and retained its higher-contrast overlay button.
- Wrapped the remaining button in `DialogClose asChild`. Closing now uses Radix's native dialog lifecycle, which triggers the existing `onOpenChange` handler, clears the selected image, and preserves focus-management behavior.
- The shared lightbox is used by both the featured carousel and gallery grid, so the fix applies to both entry points.

No database, route, styling token, environment variable, or migration contract changed.

**Verification**
- `npm.cmd run lint`: pass
- `npm.cmd run typecheck`: pass
- Structural check: the lightbox disables the injected close control and renders one `DialogClose`-backed button labeled `Close preview`
- Initial `npm run lint` attempt did not execute because PowerShell blocks `npm.ps1`; rerunning through `npm.cmd` succeeded

**Open items / handoff**
- None.

### [Codex 1] — 2026-10-27 15:57 EDT — Architecture reconciled with pushed code and confirmed production migrations/photo data

**Commits:** uncommitted documentation update; describes pushed commit `15a0180`
**Files touched:**
- Docs: `docs/PROJECT_ARCHITECTURE.md`
- Shared memory: `AGENTS.md`

**Technical explanation**

The user confirmed that commit `15a0180` was pushed and that local tracked files represent the GitHub repository. The user also confirmed that production migrations 014, 015, and 016, followed by `supabase/data/portfolio_photos_2026-10-27.sql`, all ran without error and installed the 40 reviewed photo metadata rows.

`docs/PROJECT_ARCHITECTURE.md` was reconciled with the committed implementation:
- replaced current-state sidebar descriptions with the sticky `DesktopNav` plus pinned mobile bottom navigation while preserving the sidebar sequence as historical context
- updated the gallery model to describe the 81 WebP registry, database metadata overrides, `Design` tag, owner `/photos` tool, and completed 40-row production import
- extended migration and deployment documentation through migration 016 and recorded the confirmed production state
- updated future work, local Supabase status, key file references, theme count, and resolved items
- added a document review stamp with this agent name and Eastern timestamp

No application code, database schema, production data, dependencies, or runtime configuration changed. This work overlapped Claude 1's documentation area only; existing Claude entries were preserved and the new production confirmation supersedes their earlier "not in production" handoff state.

**Verification**
- `git status --short --branch` before editing: clean, `main...origin/main`
- Documentation searches: stale current-state sidebar, migration 015 ceiling, pending photo-review, and missing-local-Supabase statements removed or converted to explicit historical context
- No build, lint, typecheck, or runtime commands were needed for documentation-only changes

**Open items / handoff**
- The user still needs to commit and push this documentation update.
- Security backlog S1–S9, loyalty-program decisions, and pending rebrand assets remain open.

### [Claude 1] — 2026-10-27 15:25 EDT — Pre-push safety check before first production deploy of this work

**Commits:** uncommitted (the user is about to commit and push; Vercel auto-deploys `main`)
**Files touched:** `supabase/.gitignore` (added `snippets/`)

**Technical explanation**

The user asked whether anything else must be git-ignored before pushing.
- **Ignore rules confirmed working (`git check-ignore`):** `.env.local`, `image-originals/`, `.next`, `tsconfig.tsbuildinfo`, `node_modules`, `supabase/.temp`, `supabase/.branches`.
- **Secret scan:** all 75 modified and untracked text files grepped for JWTs, `sb_secret_`/`sb_publishable_`, Resend `re_` keys, Google `GOCSPX-`, private keys, inline `CRON_SECRET` values, and literal passwords. **No hits.**
- **Largest new file:** 312 KB (WebP).
- **Added `snippets/` to `supabase/.gitignore`.** Local Studio saves SQL snippets there and they could contain data. The folder is empty today.

The only Git warnings were CRLF line-ending normalization, which is harmless.

**Deploy notes given to the user:**
- No new Vercel env vars are required.
- `DEV_MAILPIT_URL` and `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS` are local-only; never set them in Vercel.
- Run SQL 014 → 015 → 016 → `supabase/data/portfolio_photos_2026-10-27.sql` in production. The code tolerates the migrations being missing, so order relative to the deploy doesn't matter.
- GitHub Actions CI also runs lint, typecheck, and build on push.

**Verification:** a probe file in `supabase/snippets/` was confirmed ignored, then deleted.

### [Claude 1] — 2026-10-27 15:15 EDT — Gallery tag "Fun" renamed to "Design" (owner request)

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- `src/lib/portfolio.ts`
- `supabase/migrations/016_rename_fun_tag_to_design.sql` (new; **applied locally, not in production**)
- `supabase/data/portfolio_photos_2026-10-27.sql` (regenerated)

**Technical explanation**

*Code (`portfolio.ts`):*
- `PortfolioTag` and `PORTFOLIO_TAGS` now say `"Design"` (same position, so `STYLE_TAGS` follows).
- The 16 `LABELED_SETS` entries tagged "Fun" now say "Design".
- The filename matcher is now `Design: ["design", "fun"]`. The old filenames (`FunNails1`, `3DWFun`, `FrenchFun`, …) keep their names but map to Design, and their derived titles follow (e.g. "3D & Design").
- Comment examples updated.

*Migration 016:*
- drops `portfolio_photos_tags_check`
- `array_replace(tags, 'Fun', 'Design')` on the affected rows
- re-adds the constraint with `Design`

A new migration was used instead of editing 015 because 015 is already applied locally.

**Production order is now 014 → 015 → 016 → data export.** The export now contains "Design", which 015's constraint alone would reject.

**Verification**
- Local DB: 22 rows renamed (0 Fun, 22 Design, 40 total). Constraint name confirmed beforehand.
- Export: 40 upserts, 0 "Fun"; the empty-table dry run (rolled back) inserted 40.
- Home page SSR tabs: `All · Seasonal · Aura · Blooming · Design · Fruit · Ombre · French · Chrome · Cat Eye · 3D`. Gallery captions: 42 with "Design", 0 with "Fun".
- `npm run lint` and `npm run typecheck`: pass.

**Open items / handoff**
- None. Custom titles were checked and none contained "fun".

### [Claude 1] — 2026-10-27 15:05 EDT — Export of the owner's photo-tag review for production

**Commits:** uncommitted (the user handles source control)
**Files touched:** `supabase/data/portfolio_photos_2026-10-27.sql` (new)

**Technical explanation**

The user asked how to move the locally saved `/photos` review into production. The local `portfolio_photos` table had 40 rows: all `needs_review=false`, 9 custom titles, no `sort_order`, all `featured`.

I generated an idempotent upsert script from the live local rows:
- built with `format()` using `%L` literals: `text[]` tags, `::boolean` for flags, `null` sort order
- each statement is `insert … on conflict (file) do update set …`
- wrapped in `begin`/`commit`, ending with a count check

**Order for production:** migration 014, migration 015, then this file, all in the SQL Editor. The rows only take effect when the deployed code reads `portfolio_photos`.

**Verification:**
- The first generation used bare `t`/`f` booleans and failed a dry run; fixed with `%L::boolean`.
- Dry run 1 (the update path, against existing rows) in a rolled-back transaction: 40/40 applied.
- Dry run 2 (`delete` all, then insert; rolled back): 40 inserted, 9 custom titles.
- Local data verified intact afterwards (40 rows).

**Open items / handoff**
- If Gabs keeps editing locally before launch, regenerate the export first (same query). After launch, edit only on production; local becomes stale.
- Whether to commit `supabase/data/` is the user's call. It contains only tags and titles, nothing sensitive.

### [Claude 1] — 2026-10-27 14:53 EDT — Lightbox arrows removed; carousel touch lag diagnosed and fixed (no re-renders per gesture, 162 → 89 cards)

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- `src/components/portfolio/portfolio-lightbox.tsx`: prev/next removed
- `src/components/portfolio/portfolio-featured-carousel.tsx`: rewritten internals; same behavior
- `AGENTS.md` (§2.5 gotchas plus this entry)

**Technical explanation**

*Lightbox arrows.* The user reported bugs when clicking the preview's arrows quickly and asked to remove them. Reproduction (8 fast "next" clicks, sampling every animation frame): **115 of 120 frames showed an `<img>` that hadn't finished loading.** Each click swapped the caption immediately while the new full-size image (`sizes="90vw"`) was still being fetched and optimized, so caption and photo were out of sync. The dialog itself never broke (one dialog, no errors).

`PortfolioLightbox` no longer has `shiftImage` or the ChevronLeft/Right buttons; it shows the photo, title, tags, and close. This applies to both the carousel preview and the gallery preview, since they share the component and the user asked for the arrows removed "entirely". The carousel's own ‹ › strip buttons are unrelated and kept.

*Touch lag: diagnosis.* Headless Chrome via CDP, iPhone 15 emulation (393×852 @3x, touch, 4× CPU throttle), two programmatic swipes:

| Measurement | Result |
|-------------|--------|
| Dev, before | median frame 50ms, p95 183ms, max **4,783ms**, 75 long tasks |
| CPU profile top costs | `getImgProps` (next/image), `jsxDEV`, `createTask`, i.e. React re-rendering images |
| Devtools-hook commit counter: idle | **0 commits** |
| Commit counter: one swipe | **2 commits re-rendering ~1,170 fibers each** |
| Changed state in those commits | carousel hooks h14/h15 = `isPaused` / `isDragging` toggling at drag start and end |
| Carousel size | **162 cards** (the whole set duplicated for the loop) in a 47,936px track |
| Also | opening the lightbox (`setLightboxIndex`) re-rendered all cards |

So every touch froze the main thread right as the drag should start.

*Fix (`portfolio-featured-carousel.tsx`).*
1. `isPaused`/`isDragging`/`setWidth` state replaced with refs: `draggingRef`, `reducedMotionRef`, `lightboxOpenRef`, `setWidthRef`. A single rAF loop runs for the component's lifetime and skips advancing while paused, instead of the old effect that restarted on state changes. The cursor is set directly on the track element.
2. `CarouselCard` is wrapped in `React.memo` with stable props: the image objects come from the props array, and `onOpen` is a single `useCallback((index) => …)`. Opening or closing the lightbox therefore re-renders only the lightbox.
3. The loop renders `images + first LOOP_CLONES (8)` instead of `images × 2`. The loop width is measured as the first clone's `offsetLeft` (ResizeObserver on the track). Drag offsets are wrapped with `normalizeOffset` on every move, so dragging past either end never shows blank space; the old end-of-drag normalize is no longer needed.
4. The carousel pauses while the lightbox is open (saves redrawing the blurred overlay over a moving strip). Fixed a latent bug: after any drag, `resetDrag` used to set `isPaused=false`, restarting auto-scroll even with prefers-reduced-motion. Reduced motion now stays paused.

**Verification**
- Commit counter after the fix:

  | Action | Before | After |
  |--------|--------|-------|
  | One swipe | 2 commits, ~2,350 fibers | **0 commits** |
  | Page scroll | ~1,180 fibers | **14 fibers** (ScrollReveal only) |

  Cards: 162 → **89**.
- CPU profile after: React 0.27s and app code a few ms, versus seconds before; the remainder is "(program)", the browser's native rendering.
- Dev after: max frame 433ms (was 4,783). Toggling the Halloween layers and backdrop-blur gave noisy, inconclusive differences in headless software rendering, so they were left as is.
- **Production build** (`npm run build` + `npm start`, dev server stopped temporarily): median 33–49ms, **p95 67ms, max 117–150ms** under 4× throttle and software rendering. A real iPhone with GPU compositing should do better.
- Regression (production server):
  - auto-scroll advances
  - dragging 400px past the start shows cards at both viewport edges (offset wrapped to 23,698)
  - 6× "previous" keeps both edges filled
  - mouse click opens the preview; a 160px drag doesn't; touch tap (393px, touch emulation) opens the right photo
  - the preview has 0 arrow buttons; the carousel pauses while it is open and resumes after Esc
- `npm run lint` and `npm run typecheck`: pass. After `npm start` was stopped, `.next` was cleared and the dev server restarted (ready).
- Noticed the user's own Photos-tool data (e.g. a custom title "Stripes and Polka dots"; 40 rows) and did **not** touch it.

**Open items / handoff**
- If phones still feel heavy with Halloween on, the next suspects are GPU effects: `backdrop-filter` on the header and bottom nav over animating content, plus the full-screen pumpkin and fog layers. Measure on a real device (e.g. Safari Web Inspector over USB) before changing anything.
- Dev mode is inherently slower (React dev checks plus on-demand image optimization). Judge smoothness on a production build.

### [Claude 1] — 2026-10-27 14:25 EDT — Desktop top nav replaces sidebar; carousel opens preview; tag-filter toggle; owner Photos tool (migration 015)

**Commits:** uncommitted. One-time git exception, requested by the user: `git rm --cached` on the 7 staged `public/portfolio/Gabby Nails-*.JPEG` files. Nothing else was touched in git.
**Files touched:**
- Nav:
  - New: `src/lib/nav.ts`, `src/components/desktop-nav.tsx`
  - Edited: `src/app/layout.tsx`, `src/components/site-header.tsx`, `src/components/mobile-bottom-nav.tsx`
  - Deleted: `src/components/{app-sidebar,sidebar-auth}.tsx`, `src/components/ui/{sidebar,sheet,tooltip,separator,skeleton}.tsx`, `src/hooks/use-mobile.ts`
  - Dead sidebar/tab CSS removed from `src/app/globals.css`
- Gallery:
  - New: `src/components/portfolio/portfolio-lightbox.tsx`
  - Edited: `portfolio-showcase.tsx`, `portfolio-featured-carousel.tsx`, `src/app/page.tsx`, `src/lib/portfolio.ts`
- Photos tool:
  - New: `src/lib/portfolio-photos.ts`, `src/app/photos/{page,actions}.ts(x)`, `src/components/photos/photo-manager.tsx`
  - New: `supabase/migrations/015_portfolio_photos.sql` (**applied locally; NOT in production**)
- Docs: `AGENTS.md`, `docs/PROJECT_ARCHITECTURE.md`

**Technical explanation**

*Requirements.* Asked first: one top bar on desktop, owner tabs after a divider, carousel tap opens the preview, and an in-site owner tag tool (tags, title, order and carousel picks; fixed tab list; no uploads). Plus:
- The tall MENU tab was "obnoxious" and overlapped content.
- Remove "Tap to book" from the carousel.
- Clicking the active filter tag returns to All; clicking All while on All does nothing.
- Unstage the photoshoot images.

Claude's own calls, reported to the user:
- The owner page is named **"Photos"**, not "Gallery", to avoid a Gallery/Portfolio clash after the user's earlier rename.
- Reordering uses ↑/↓/"Move to top" buttons instead of drag-and-drop, which is unreliable on phones.

*Navigation.*
- `nav.ts` holds the single source of nav items (`PUBLIC_NAV`, `OWNER_NAV`, `isNavItemActive`), used by both bars.
- `DesktopNav` (client, `usePathname`) renders in the root layout, not per page, so `PageMotion` doesn't re-animate it. It is `sticky top-0 z-40 hidden md:flex` and holds: name link, tabs (`aria-current="page"` pill), a divider plus owner tabs (`overflow-x-auto` so narrow widths scroll instead of overflowing), `SocialLinks`, and Sign in (link) or Sign out (`signOut` action).
- The layout no longer uses `SidebarProvider`/`SidebarInset`. They were replaced with the same classes on a plain `div` and `main`, which preserves the mobile fixed-height column that pins the bottom nav.
- `SiteHeader` is `md:hidden`, plus a desktop-only `sr-only` `h1` so each page keeps a heading.
- Every sidebar-only file and its CSS (slide panel, layout gap, MENU tab) is deleted. `@radix-ui/react-tooltip` and `react-separator` are now unused in `package.json`; removal is left as optional cleanup to avoid lockfile churn.

*Carousel and lightbox.*
- The lightbox was extracted from `PortfolioShowcase` into `PortfolioLightbox` (`images`, `index`, `onIndexChange`).
- Carousel cards are now `<button data-carousel-index>` (they were `<Link href="/book">` with a "Tap to book" caption, which was removed).
- **Why taps used to fail:** the carousel `setPointerCapture`s mouse presses for dragging, so the card never received the click.
- **Mouse:** `pointerdown` records the pressed card index, and `pointerup` opens it when the pointer type is mouse and there was no drag.
- **Touch and keyboard:** the card's own `onClick` opens it, guarded by `!didDragRef.current`. Both paths set the same index, so they are idempotent.

*Filter toggle.* The showcase tag click does nothing for All→All, and otherwise sets `tag === activeTag ? "All" : tag`. It also sets `aria-pressed`.

*Photos tool.*
- **Migration 015, `portfolio_photos`:**
  - `file` pk (`^[A-Za-z0-9._-]+\.webp$`)
  - `title` (nullable; 1–60 chars; null = tags joined)
  - `tags text[]` (check `<@` the fixed tag list)
  - `featured bool` (default true)
  - `sort_order int` (null = default order)
  - `needs_review bool` (default true), `updated_at`
  - RLS: public select; insert, update, and delete gated by `is_owner()`
  - **No seed data**: rows exist only for photos the owner has saved or reordered.
- **Defaults** (`PORTFOLIO_PHOTO_DEFAULTS`): `customTitle` is null when the title equals `autoTitle(tags)`, so auto titles follow tag edits. LABELED sets have `needsReview: true`.
- **Merging** (`getManagedPhotos`, React `cache`): DB rows override defaults. The sort puts photos with null `sort_order` first in default order (so newly added photos lead), then ascending `sort_order`. On `PGRST205`/`42P01` it returns the defaults with `tableReady=false`, so production keeps working before the migration.
- **Public view** (`getPortfolioView`): returns the gallery plus `featured` (falls back to all if none are featured). The home page is now an async server component that passes these to the carousel and showcase.
- **Actions** (owner-gated):
  - `savePhoto` validates the file against the code list, tags against `STYLE_TAGS`, and title length, then upserts with `needs_review=false`. Used by both "Looks right ✓" and "Save changes".
  - `reorderPhotos(files)` re-reads the merged state and upserts **all** photos with their current values plus `sort_order=index`, so creating rows never resets tags or review status. It rejects stale lists.
  - Both revalidate `/` and `/photos`.
- **UI:**
  - Filters: "Needs review (n)" (the default when any exist), "All photos", "In carousel".
  - Cards: square photo on phones (4:5 from `sm` up), status badge, "#n of 81", title input (placeholder = auto title), tag chip toggles (hidden `tags` inputs), "Show in the moving carousel" checkbox, and order buttons (only in All view).
  - The submit label adapts: Looks right ✓ / Save changes / Confirmed ✓.
  - When the table is missing, a `fieldset disabled` plus a warning explains that migration 015 is needed.

**Verification** (headless Chrome, plus SQL checks)
- Visitor at 1440px: tabs `[Portfolio] · Book · Services & Pricing · About`; no sidebar elements; nav `position: sticky`.
- Filter toggle: Seasonal → Seasonal; again → All; All → All.
- Carousel on a visible card: mouse click and **touch tap** (touch emulation, 393px) open the lightbox on the right photo; a 160px mouse drag does not.
- Owner at 1440px: `Portfolio · Book · Services & Pricing · About · Stats · Clients · [Photos] · Theme`. Owner mobile bar: 8 items; DesktopNav `display: none`.
- `/photos`:

  | Action | Result |
  |--------|--------|
  | Load | "Needs review (40) / All photos (81) / In carousel (81)" |
  | Looks right on IMG_8049 | DB `needs_review=false tags=Fun`; count drops to 39 |
  | Edit IMG_8047 (add Aura, title "Test Title") | DB `title=Test Title tags=Seasonal+Aura` |
  | Move last photo to top | 81 rows; `sort_order 0 = FunNails6`; home gallery starts with FunNails6 |
  | Untick Square1 carousel | `featured=f`; Square1 gone from the carousel, still in the gallery |

- **All test rows (81) and the temporary owner were deleted afterwards**, so the tool starts clean with 40 to review.
- A first test run hit the nav's Sign-out form through a too-broad `form` selector, before any write. The DB was checked (0 rows), the selectors fixed, and the run repeated.
- While updating this file, an inline `node -e "…"` contained unescaped backticks, so Bash command-substituted `src/lib/nav.ts`. It tried to run the file as a shell script; this only produced "command not found" errors, and the file was unchanged. One AGENTS.md row lost that path and was fixed by hand. **Lesson: put doc-editing scripts in a file instead of `node -e` with Markdown backticks.**
- `npm run lint` and `npm run typecheck`: pass.

**Open items / handoff**
- **Production needs migrations 014 and 015** before Halloween and photo editing are used. The user plans to run them later; until then both fall back safely.
- Gabs should work through **/photos → Needs review** on her phone. The printable review sheets in `image-originals/review/` are now optional.
- Optional: remove `@radix-ui/react-tooltip` and `@radix-ui/react-separator` from `package.json`; consider drag-and-drop ordering if Gabs asks for it.

### [Claude 1] — 2026-10-27 13:48 EDT — Halloween refresh (pumpkins, fog, softer orange, no glows), hero removed, tall MENU tab, 40 new photos + About photo, all images → WebP

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- Images:
  - New git-ignored `image-originals/` (`portfolio/` 81, `about/`, `photoshoot/` 6, `retired/`, `review/`); `.gitignore` updated
  - `public/portfolio/*.webp` (81, replacing all `.jpeg`/`.jpg`)
  - `public/about/NailsByGabsAboutPhoto.webp` (replaces `HeadshotGabrielle.jpeg`)
  - `public/effects/pumpkins.svg` (new)
  - Deleted `public/portfolio/.gitkeep`
- Gallery: `src/lib/portfolio.ts` (rewritten registry)
- Home/About: `src/app/page.tsx`, `src/app/about/page.tsx`, `src/components/effects/profile-card.tsx`
- Deleted: `src/components/portfolio/portfolio-hero.tsx`, `src/components/effects/{blur-text,rotating-text,silk-background,star-border}.tsx`
- Halloween/UI: `src/components/effects/halloween.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/themes.ts`, `src/components/mobile-bottom-nav.tsx`, `src/components/ui/sidebar.tsx`
- Tooling: `scripts/optimize-images.mjs` (help text)
- Docs: `AGENTS.md` (§2.3/§2.5/§2.7 refreshed), `docs/PROJECT_ARCHITECTURE.md`

**Technical explanation**

*Requirements* (three rounds of questions first):
- Halloween: replace the bats with a faint diagonal-drifting pumpkin pattern, entirely in the background. Keep the Creepster titles. Make the fog more noticeable. Tone the orange down a little and keep the green as intense.
- "Less AI-like" turned out to mean **solely colors and glows**, mostly in Halloween.
- Skip the hero.
- Claude drafts copy, user reviews.
- Desktop: a tall labeled tab that opens on hover or click, because clients are often not tech-savvy.
- New photos: 40 `IMG_*` nail sets (no style info in names; Claude suggests tags, owner confirms) plus `NailsByGabsAboutPhoto.JPEG` (the renamed `Gabby Nails-16`) for About. The other photoshoot images are unused. Add a **Seasonal** tab.
- Optimize everything now, with originals in a git-ignored folder.
- Mobile nav "Gallery" → "Portfolio".

*Images.* Originals moved out of `public/` into `image-originals/`, then `npm run images:optimize` was run: 81 photos went from 238.0 MB to 9.4 MB, and the About photo from 2.6 MB to 82 KB (2000×1333). All files return 200 from the dev server, including through `/_next/image`. `.webp` was already excluded by the middleware matcher, so no session refresh runs per image (this also fixes the old uppercase-`.JPEG` matcher miss).

*Registry (`portfolio.ts`).* New `LABELED_SETS: { file, tags, title?, focal? }[]`, rendered first (newest work first). Then the old `PORTFOLIO_FILE_NAMES` (now `.webp`) with unchanged filename parsing. A `joinLabels()` helper is shared by both paths. New `"Seasonal"` tag, placed right after "All" in `PORTFOLIO_TAGS`, with filename matchers for future names (halloween, holiday, christmas, valentine).
- **Tags were drafted visually from contact sheets.** Halloween sets get title "Halloween"; 6198 is "4th of July". The 6 least certain are commented `// check` (8049, 7895, 7796, 7125, 6074, 5944).
- **Crop points** were measured per photo from gridded sheets.
- **Review:** `image-originals/review/new-photo-tags-{1..5}.jpg` show each photo with its drafted title and tags; flagged ones are highlighted orange.

*About photo.* `ProfileCard` gained `imagePosition` (applied as `objectPosition`; the hardcoded `object-center` was removed). The About page uses `imagePosition="47% 35%"` to keep Gabs's face centered in the 4:5 crop of a landscape photo.

*Home page.* `PortfolioHero` was removed, along with its effects (BlurText, RotatingText, StarBorder shimmer, SilkBackground glow) and their CSS: `.silk-*`, `.star-border*`, `.animate-rotate-word`, the matching keyframes, the `--silk-a/b` tokens in all themes, and the reduced-motion entries. In its place is a plain intro section with no card, glow, or animation:
- `h2.seasonal-title` "GelX sets by Gabs"
- one line: "Webster, NY year-round and SUNY Binghamton during the semester. Find a set you love, then grab an open time."
- "Book an appointment" and "See prices" buttons

**This copy is a draft awaiting the user's review.**

*Halloween.*
- **Bats removed** (component, CSS, and keyframes).
- **Pumpkins.** `HalloweenPumpkins` is the first child of `SidebarInset`. It is a fixed layer that overhangs by one 180px tile and animates `translate3d(0,0,0)` → `(180px,180px,0)` over 45 s linear, so the loop is seamless and GPU-composited. It sits at opacity 0.13 with the background `url(/effects/pumpkins.svg) 0 0 / 180px repeat`.
- **Layering.** `SidebarInset` is an isolated stacking context, so on desktop `z-index: -1` paints the layer above its `bg-background` and under the non-positioned page. On mobile, `.mobile-ambient-bg > *` makes the page z-index 1, so a `(0,2,0)`-specificity override sets z-index 0 there. Under Halloween, `.page-gradient` becomes transparent so the pattern shows; cards, photos, and the blurred header keep their own backgrounds.
- **Fog:** opacity 0.2 → 0.42, height 30vh → 40vh, plus a third lavender band.
- **Orange:** `--primary`/`--sidebar-primary` `#ff7a1a` → **`#ef8a45`** (HSL saturation 100% → 84%). Contrast is 7.81:1 on the background and 7.60:1 with button text. Also changed: `--sidebar-accent-foreground` `#f4b886`, the slot-webster colors, the email palette, and the picker swatch. `--accent` `#a3e635` is unchanged.
- **Glows:** title `text-shadow` removed; `--hero-glow-a/b` lowered to 0.10/0.16. Site-wide: `.book-cta-glow` is now a neutral soft shadow with a lighter accent border (no colored glow or halo ring), and the mobile `.site-header-shadow` accent mix went from 45% to 25%.

*Desktop menu tab.*
- **Shape:** `.sidebar-hover-tab` is now `top: 4.5rem`, `height: min(62vh, 32rem)`, `width: 2rem` (2.5rem on hover), a column with a vertical upright "MENU" label (`writing-mode: vertical-rl; text-orientation: upright`) and the left chevron (kept per the owner's earlier choice). Muted fill is `color-mix(sidebar 90%, primary)`.
- **Behavior:** `Sidebar` adds `onClick → setOpen(true)` on the tab, plus a `containerRef` and an effect that, while expanded on desktop, closes on a document `pointerdown` outside the panel or on Escape. Mouse-leave closing is unchanged.

**Verification**
- Headless Chrome screenshots, Halloween active:

  | Page and size | Result |
  |---------------|--------|
  | `/` at 1440×900 | pumpkin pattern behind content, fog at bottom, softer orange, no title glow, intro instead of hero, tall MENU tab |
  | `/` at 393×852 | same; "Portfolio" label in the bottom nav |
  | `/about` at 393×852 | new photo framed on her face |

- Menu tab, measured 32×498 px at y = 72:

  | Interaction | Result |
  |-------------|--------|
  | Click only (no hover) | expanded |
  | Click outside | collapsed |
  | Open, then Esc | collapsed |
  | Hover | expanded |
  | Glide to "Services" and click | `/services` |

- `npm run lint` and `npm run typecheck`: pass.

**Open items / handoff**
- **User and Gabs review the drafted tags** (`image-originals/review/`), especially the 6 flagged, then update `LABELED_SETS`.
- **User reviews the intro copy** in `src/app/page.tsx`.
- **Git:** the 7 photoshoot JPEGs were staged earlier under `public/portfolio/` and now show as `AD`, so the user should run `git rm --cached` on them. The old gallery JPEGs show as deleted (`D`) and the WebP files as new (`??`), which is expected.
- The new logo is still pending from the owner.

### [Claude 1] — 2026-10-27 13:07 EDT — Client emails: own cancellation, "Gabs dropped your appointment", "Gabs updated your appointment"

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- Email: `src/lib/notifications.ts`
- Actions: `src/app/book/actions.ts`
- UI: `src/components/booking/booking-calendar.tsx`
- Docs: `docs/PROJECT_ARCHITECTURE.md` (§13 email table and rules), `AGENTS.md`

**Technical explanation**

*Requirements* (asked first, per the user's ask-before-large-changes rule):
1. Clients get an email when they cancel.
2. Clients get "Gabs dropped your appointment" when Gabs **releases or deletes** their booking.
3. Clients get "Gabs updated your appointment" when Gabs changes the booking.

Decisions:
- "Updated" fires on **time or location changes only**, not on Gabs's internal `booked_name` label.
- **Upcoming appointments only.**
- **Optional note box** from Gabs on drop and edit.
- **Reset the 48h reminder** when the time changes.

*Email layer (`notifications.ts`).*
- `readUpcomingClientBooking(slotId)` uses the service role (the client's email lives in `auth.users`). It reads the slot, booker name, and `auth.admin.getUserById(booked_by).email`, and returns `ClientBookingSnapshot` (email, original start/end/location, prebuilt `BookingNotificationDetails`). It returns null for manual bookings (`booked_by` null), non-booked slots, appointments whose `end_at` has passed, an invalid email, or a missing service role. It never throws.
- New senders, all never throwing:
  - `notifyClientOfCancellation(details, email)`: subject "Your appointment is cancelled — {time}"
  - `notifyClientOfDroppedAppointment(snapshot, message)`: subject "Gabs dropped your appointment"
  - `notifyClientOfUpdatedAppointment(before, after, message)`: subject "Gabs updated your appointment", showing the new details plus a struck-through "Previously: …" line containing only the parts that changed
- All three go through the existing themed `buildEmailHtml`. Gabs's note is rendered by `ownerMessageHtml`: escaped, with newlines turned into `<br>`, in an accent-bordered quote. Client notes are deliberately left out of the drop and cancel emails.

*Actions (`book/actions.ts`).* `normalizeClientMessage()` trims and caps the note at 500 characters.
- `cancelMyBooking`: after the RPC succeeds, sends the owner alert and the new client confirmation in parallel. It reuses the `details` read before the RPC and the session `user.email`.
- `releaseSlot(slotId, clientMessage?)` / `deleteSlot(slotId, clientMessage?)`: take the snapshot **before** the RPC or delete (both clear `booked_by`), then notify on success.
- `updateSlot`: selects `start_at, end_at, location, booked_by` and computes `timeChanged` / `locationChanged`. It snapshots only for booked platform slots where something changed, and adds `reminder_48h_sent_at: null` to the update when the time changed. The owner `UPDATE` policy covers all columns, so no migration was needed. It notifies only when the new `end_at` is in the future.

*UI (`booking-calendar.tsx`).*
- `emailsClient(slot)` is true for booked, `booked_by` set, `end_at` in the future. `requestDrop()` runs Release/Delete directly when it is false (open, manual, past); otherwise it opens a confirm dialog ("Release/Delete this appointment?") that explains what happens to the slot, names the client, and has an optional "Message to {first name}" textarea (max 500) and "Release/Delete & email client".
- The edit dialog shows an optional `clientMessage` textarea when `emailsClient(editTarget)` is true, explaining that the email only goes out if the time or location changes.

*Note:* `/book` only lists slots whose `end_at` is after now (`book/page.tsx`), so Gabs cannot act on past appointments from the UI today. The "upcoming only" checks are a safety net for races (an appointment ending while the page is open) and for future cleanup tools.

**Verification**
- End-to-end in headless Chrome. Setup: temporary owner and client accounts; 4 platform bookings and 1 manual booking inserted via SQL in the week of Oct 29–31.

  | Scenario | Result |
  |----------|--------|
  | A. Client cancels | `gabs@example.com` gets "Booking cancelled: Temp Client's Nails"; client gets "Your appointment is cancelled — Thu, Oct 29 · 9:00 AM – 10:00 AM" |
  | B. Owner moves 1 PM Webster → 2 PM Binghamton, with a note containing `<3` | Client gets "Gabs updated your appointment" (new time, "Previously" line, escaped note); `reminder_48h_sent_at` NULL after (was set) |
  | C. Owner changes label only | 0 emails |
  | D. Owner releases, with a note | Popup "Release this appointment?"; client gets "Gabs dropped your appointment" with the escaped note; slot `open`, `booked_by` null |
  | E. Owner deletes, no note | Client gets "Gabs dropped…" with no message block; slot removed |
  | G. Owner releases the manual booking | No popup, 0 emails; slot open |

- Rendered the "updated" and "dropped" emails visually. They used the Halloween palette, because the user had turned Halloween on locally (schedule back to cherry-studio on Nov 1). Layout, strikethrough, and quote block are correct.
- Cleanup: test slots, their 6 `booking_events` rows, and both temporary accounts deleted. The user's booking (Thu Oct 29, 3 PM) and accounts are untouched; the user's Halloween setting was left as is.
- `npm run lint` and `npm run typecheck`: pass.

**Open items / handoff**
- Observed, not changed: the client-only "Book next available spot" button at the bottom of `booking-calendar.tsx` uses `position: fixed` inside `PageMotion`'s transformed ancestor (see the §2.5 gotcha). It may anchor to the page container instead of the viewport, especially in Instagram's webview. Worth checking on a phone and switching to `sticky` if it misbehaves.
- Gabs is not emailed about her own actions (by design; she made the change).

### [Claude 1] — 2026-10-27 12:54 EDT — Fix: owner (Gabs) booking/cancellation emails skipped in local testing

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- Email: `src/lib/owner-contact.ts`

**Technical explanation**

*Symptom.* Locally, a client booked and then cancelled. The client received "Appointment confirmed" in Mailpit, but Gabs received neither the "New booking" nor the "Booking cancelled" email. The dev log showed `Skipped: missing booking details or owner email` and `Skipped cancellation alert: missing owner email`.

*Root cause.* `isValidNotificationEmail()` in `owner-contact.ts` deliberately rejects any address containing `example.com`. This guards production from emailing the placeholder `gabs@example.com` that migration 001 seeds into `app_config.owner_email`. In local testing that placeholder *is* the owner account, so `getOwnerNotificationEmail()` returned null and both owner notifications were skipped. Client emails were unaffected because they go to the booker's auth email.

*Fix.* A new `isLocalMailpit()` returns true when `NODE_ENV !== "production"` and `DEV_MAILPIT_URL` is set. The `example.com` rejection now applies only when that is false. In production (or local dev without Mailpit) behavior is unchanged. Locally, owner emails resolve through the real path: env `OWNER_NOTIFICATION_EMAIL`, then `app_config.owner_notification_email`, then `owner_email` = `gabs@example.com`. Mailpit accepts any address.

**Verification**
- End-to-end in headless Chrome as a temporary client, using a temporary open Webster slot (Fri Oct 30, 11:00 AM ET) and notes containing HTML:

  | Action | Emails in Mailpit |
  |--------|-------------------|
  | Booking | "New booking: Temp Client's Nails" → `gabs@example.com`; "Appointment confirmed — Fri, Oct 30 · 11:00 AM – 12:00 PM" → client |
  | Cancel | "Booking cancelled: Temp Client's Nails" → `gabs@example.com` |

- Notes were HTML-escaped in both booking emails, which confirms the earlier S2 escaping works end to end.
- No new `[notifications] Skipped` lines in the dev log.
- Cleanup: deleted the test slot, its `booking_events` rows (`booked`, `cancelled`), and the temporary client. The three test emails were left in Mailpit on purpose so the user can see Gabs's emails. The user's own booked slot and accounts are untouched.
- `npm run lint` and `npm run typecheck`: pass.

**Open items / handoff**
- **Email coverage gaps (not built; ask the user first):**
  - No email to the *client* when they cancel (listed in architecture §20 future directions).
  - No email to the client when Gabs releases or deletes their booking.
  - No email to the client when Gabs edits the time or location of their booking.
- Loyalty program questions are parked until the user returns to it. See the 2026-10-27 12:40 handoff and the user-facing question list.

### [Claude 1] — 2026-10-27 12:40 EDT — Halloween seasonal theme with scheduled switch-back; local email via Mailpit

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- DB: `supabase/migrations/014_seasonal_theme_schedule.sql` (new). **Applied locally; NOT applied in production.**
- Theme: `src/lib/themes.ts`, `src/lib/theme.ts`, `src/app/settings/actions.ts`, `src/app/settings/page.tsx`, `src/components/settings/theme-picker.tsx`
- Effects/UI: `src/components/effects/halloween.tsx` (new), `src/app/layout.tsx`, `src/components/site-header.tsx`, `src/components/portfolio/portfolio-hero.tsx`, `src/components/clients/clients-list.tsx`, `src/app/globals.css`
- Email: `src/lib/notifications.ts`, `supabase/config.toml`, `.env.example`, `.env.local` (local only)
- Docs: `AGENTS.md`, `docs/PROJECT_ARCHITECTURE.md`

**Technical explanation**

*Process.* Following the user's new instruction to ask before large changes, the requirements were settled across three rounds of questions before any Halloween code was written:
- dark spooky palette
- bats, fog, and a spooky font (no banner), toned down to 2 bats and fainter fog
- an owner popup on activation, for seasonal themes only, with an optional date+time switch-back (default Nov 1 at 12:00 AM Eastern) and a chosen theme to switch back to
- bats and fog on every page; the font on page titles and the home headline
- emails follow the theme

*Migration 014.*
- Seeds `app_config` keys `theme_revert_at` (ISO UTC) and `theme_revert_to`, with empty meaning none.
- Widens the public read policy to `('active_theme', 'theme_revert_at', 'theme_revert_to')`.
- Adds `is_site_theme(text)`, the single list of allowed ids.
- Adds `set_site_theme(p_theme, p_revert_at, p_revert_to)`: security definer, `is_owner()` required. It rejects invalid themes, past times, and switching back to the same theme, and writes all three keys. Executable by `authenticated` only.
- Adds `apply_due_theme_revert()`: security definer, executable by `anon` and `authenticated`. It locks the schedule rows `for update`, does nothing unless the switch-back is due, then switches and clears the schedule. It is idempotent.
- Keeps the old direct-update policy (now allowing `halloween`) so the currently deployed code still works if the migration lands before the deploy. The new code needs the migration; `PGRST202` is mapped to an instructive error.

*App.*
- `getThemeState()` (React `cache`) reads all three keys in one query. If a switch-back is due, it calls `apply_due_theme_revert()` and returns the switch-back theme, so no cron is needed (the Hobby plan only allows a daily one).
- `setActiveTheme` parses `revertAt` as Eastern wall time with `parseBusinessDateTimeLocal` and calls the RPC. Any manual switch replaces an existing schedule.
- `cancelThemeRevert` re-saves the current theme with no schedule.
- The settings page computes the popup defaults on the server: the next occurrence of `seasonal.defaultRevertMonth/Day` at 00:00 Eastern, and the current everyday theme. This avoids hydration and timezone drift.
- The picker:
  - Seasonal cards open a Radix `Dialog`.
  - The "Switch back automatically" checkbox disables the date and theme fields when unticked.
  - The switch-back theme list offers everyday themes only.
  - A scheduled-revert banner offers "Keep this theme".
  - Each preview card now uses `bg-background text-foreground` under its own `data-theme`, so every card previews its real colors.

*Look.* `[data-theme="halloween"]`:
- `color-scheme: dark`, so native date pickers and selects match
- bg `#0f0a14`, text `#f3e9dc`, primary `#ff7a1a`, accent `#a3e635`
- every text/background pair at least 7.3:1 (checked)

New `--success` / `--warning` tokens (`text-success` / `text-warning`) replace the hardcoded `text-emerald-800` / `text-amber-900` on the Clients page, so badges stay readable on dark.

*Effects* (CSS-only, no React state; see the carousel lesson in the next entry down):
- **Bats:** 2 near-black SVG bats with an orange rim glow. Flight is a `translate3d` keyframe path over 18 s / 23 s (the bats are on screen about 40% of each cycle); wing flaps are `scaleY` at 0.3 s. They render at body level at z-45, above content and the mobile nav, below dialogs (z-50) and the desktop sidebar.
- **Fog:** two radial gradients at opacity 0.2, drifting 26 s, rendered inside `SidebarInset` before `MobileBottomNav`. `.mobile-ambient-bg > .halloween-fog` overrides the generic `> * { position: relative }` so it stays fixed. Both are z-index 1 inside that isolated context, and the nav is later in the DOM, so the fog sits above the page and under the nav, as requested. No `filter: blur`, for mobile GPU cost.
- **Reduced motion:** bats are hidden and the fog stops.
- **Font:** Creepster via `next/font` with `preload: false`, applied by `[data-theme="halloween"] .seasonal-title` to the header `h1` and the hero `h2`, so the file only downloads while Halloween is on.

*Local email.*
- `sendEmail` first checks `DEV_MAILPIT_URL` (ignored when `NODE_ENV=production`) and posts to Mailpit's `/api/v1/send` (Mailpit v1.31.3), parsing the `RESEND_FROM_EMAIL` display name.
- `config.toml`: `enable_confirmations = true` (matching production); `[auth.email.template.confirmation]` and `[auth.email.template.recovery]` point at the repo templates; `[local_smtp]` sender set to "NailsByGabs" `<hello@nailsbygabs.local>`.
- `.env.local` gained `DEV_MAILPIT_URL` and a random `CRON_SECRET`; `.env.example` documents `DEV_MAILPIT_URL`.

**Verification**
- SQL, run as real roles inside a rolled-back transaction:

  | Case | Result |
  |------|--------|
  | Client calls `set_site_theme` | blocked |
  | Bad id / past time / same switch-back theme | each gives its message |
  | Owner schedules | `theme_revert_at=…Z`, `theme_revert_to=flower` |
  | `anon` revert before due | `null` |
  | `anon` revert after due | `flower`, schedule cleared |
  | `anon` calls `set_site_theme` | permission denied |

- Headless Chrome owner flow at 393×852, using a temporary owner that was deleted afterwards:

  | Step | Result |
  |------|--------|
  | Popup defaults | `2026-11-01T00:00`, Cherry Studio, everyday themes only |
  | Submit | DB `halloween` / `2026-11-01T04:00:00Z` / `cherry-studio` |
  | Banner | "Switches back to Cherry Studio on Sun, Nov 1, 12:00 AM (Eastern)" |
  | Keep this theme | schedule cleared |
  | Plain theme | switches with no popup |
  | Unticked switch-back | fields disabled, no schedule saved |
  | Forced-due schedule | applied on the next page load (`pearl`) |

- Screenshots of `/`, `/services`, and `/book` at mobile and desktop widths: 2 bats, fog, and Creepster titles present; layout intact.
- Mailpit: a send-API format check returned 200. A real sign-up produced "Confirm your NailsByGabs account" from NailsByGabs `<hello@nailsbygabs.local>`, rendered from the repo template, with a `localhost:3000/auth/callback` link. The test messages and user were deleted.
- `npm run lint` and `npm run typecheck`: pass. `npm run build` was not run, because the dev server was using `.next`.
- Local DB restored to `cherry-studio` with no schedule. Accounts: `gabs@example.com` (owner) and `client1@example.com` (client).

**Open items / handoff**
- **Production:** apply migration 014 in the Supabase SQL Editor and deploy, in either order, **before Gabs selects Halloween**, ideally before 2026-10-31.
- Booking-email delivery to Mailpit is format-verified, but no real booking was sent end-to-end. The user will see it on their next local booking.
- Possible follow-ups: an OG/share image for the seasonal theme; more seasonal themes (Christmas, Valentine's) reuse the same `seasonal` mechanism.

### [Claude 1] — 2026-10-27 11:57 EDT — Fix: sign-up showed "NEXT_REDIRECT" instead of redirecting

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- Auth: `src/app/auth/actions.ts` (`signUp`)

**Technical explanation**

*Symptom.* On local Supabase, submitting the sign-up form displayed the error text "NEXT_REDIRECT" and stayed on `/auth/signup`. The account was in fact created: `gabs@example.com` existed in `auth.users` with the `owner` profile role.

*Root cause.* `signUp` called `redirect("/book")` inside `try { … } catch (err) { return { error: err.message } }`. `redirect()` works by throwing an error whose message is `NEXT_REDIRECT`, so the catch turned the redirect into an error state.

The branch only runs when `supabase.auth.signUp` returns a session, which happens only when email confirmation is disabled. In production (confirmations on) it never ran, which is why the bug was latent. It dates from commit `0664dcb`, "Support immediate signup while email confirmation is disabled".

*Fix.* The `try` now records `signedIn = !!data.session`, and `redirect("/book")` runs after the `try/catch`. This mirrors `updatePassword` in the same file. The confirmation-required path still returns the "check your email" message. I scanned all of `src/` for other `redirect()` calls inside `try` blocks and found none.

**Rule:** never call `redirect()` or `notFound()` inside a `try` whose `catch` doesn't rethrow.

**Verification**
- Headless Chrome sign-up as `client-test@example.com` ("Client Test", local DB only) lands on `/book` in about 6.5 s on first compile, with the header showing "Sign out". The DB has `client-test@example.com -> client`.
- `npm run lint` and `npm run typecheck`: pass.

**Open items / handoff**
- The local DB now contains the test client `client-test@example.com` (password `local-test-pass-123`). Delete it in Studio if unwanted.

### [Claude 1] — 2026-10-27 11:47 EDT — Fix: home-page carousel starved all navigations and caused stutter

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- UI: `src/components/portfolio/portfolio-featured-carousel.tsx`

**Technical explanation**

*Symptom (user report).* On localhost the site stuttered. Desktop sidebar links "did nothing", and the sign-in button seemed unresponsive. The mobile bottom nav appeared to work.

*Diagnosis.* I drove headless Chrome through the DevTools Protocol with probe scripts kept in the session scratchpad, not the repo.
1. **Hydration was fine:** React props were attached, `window.next.router` existed, and there were no console errors.
2. **Sign-in worked once hydrated:** the form POSTed and returned "Invalid login credentials" for an unknown account. The "unresponsive" button was the dev server compiling on demand. The first `/` took 16 s, and each new route took 2–3 s before its JavaScript arrived.
3. **Desktop sidebar:** hovering expanded it, the click landed on the `<a>`, and `next/link` called `preventDefault()`. But `history.pushState` never ran, even though the server answered `GET /services 200` in under 1 s.
4. **Comparison:**

   | Starting page | Navigation | Result |
   |---------------|------------|--------|
   | `/` | hero link | hung |
   | `/` | `window.next.router.push()` | hung |
   | `/` | mobile bottom-nav link | hung |
   | `/about` | sidebar link | worked |

   So the culprit was on the home page, not in the sidebar.

*Root cause.* In `PortfolioFeaturedCarousel`, the auto-scroll `requestAnimationFrame` loop called `applyOffset(next)`, which called `setOffset(next)` every frame. The component re-rendered its 82 cards (41 images duplicated for the loop) about 60 times a second, and those were urgent updates. App Router navigations run inside a React transition, and React abandons and restarts a transition whenever an urgent update arrives. With a new urgent update every 16 ms, the navigation never committed in dev mode, where rendering is slow, and the page stuttered.

Production renders faster and mostly escaped, but the same pressure applies on slow phones and in Instagram's webview. This bug predates this session: the per-frame `setOffset` dates from the "smooth infinite scroll loop" work.

*Fix.* The scroll offset now lives only in `offsetRef` and the DOM. `applyOffset` already wrote `track.style.transform` directly, so I removed its `setOffset` call, the `syncState` parameter, the `offset` state, and the `transform` entry in the track's `style` prop. Removing `transform` from the style prop matters: if React still owned that property, any unrelated re-render (for example `isDragging` changing on pointer down) would reset it to a stale value. The existing mount effect `applyOffset(offsetRef.current)` sets the initial transform. Drag (`scheduleDragOffset`), arrow buttons (`shift`), and drag release (`finishHorizontalDrag`) all go through the same ref-plus-DOM path, so behavior is unchanged.

**Rule for other agents:** never put per-frame animation values in React state. Use refs plus direct DOM or CSS updates.

**Verification**
- Headless Chrome, after the fix:

  | Check | Result |
  |-------|--------|
  | `/` → `/services` via hero link (1280px) | 1.9 s |
  | `router.push('/about')` | 1.4 s |
  | `/` → `/services` via bottom nav (390px) | 0.9 s |
  | Sidebar hover → glide → click from `/` | navigates (`pushState /services`) |
  | Auto-scroll | ~85–89 px/s (target 84) |
  | Next arrow | steps one card (307 px) |
  | Card attribute mutations over 2 s | 0 (no per-frame re-render) |

- `npm run lint` and `npm run typecheck`: pass.

**Open items / handoff**
- Dev-mode first loads are slow by nature (on-demand compile). For a production-speed local check, run `npm run build && npm start`.
- `ScrollReveal` calls `setDirection` on every scroll event per instance. It is not per-frame like the carousel was, but it is worth throttling if scroll jank shows up on phones.

### [Claude 1] — 2026-10-27 11:32 EDT — Local Supabase + dev environment brought up and verified

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- New (created by the user's `npx supabase init`): `supabase/config.toml`, `supabase/.gitignore`
- Edited: `supabase/config.toml` (auth URLs)
- Local only, git-ignored: `.env.local`
- Docs: `AGENTS.md` (§2.6 Local development; the former §2.6 is renumbered to §2.7)

**Technical explanation**

*Intent.* The user wanted a working localhost environment backed by a local database, including a mobile-width view in Chrome DevTools. Instagram in-app browser testing is deferred.

*Steps and findings.*
1. **Docker.** The first `supabase start` failed with "cannot find dockerDesktopLinuxEngine" because Docker Desktop was not running. The `docker-desktop` WSL distro was `Stopped` and there were no Docker processes. I launched `Docker Desktop.exe` and polled `docker info` until the engine was ready. This was repeated after the user rebooted.
2. **Auth redirect URLs.** `npx supabase init` defaults to `site_url = "http://127.0.0.1:3000"` and `additional_redirect_urls = ["https://127.0.0.1:3000"]`. The app builds auth links from `NEXT_PUBLIC_SITE_URL` (`getAuthCallbackUrl()`, `getPasswordResetCallbackUrl()` in `lib/site-url.ts`) as `http://localhost:3000/auth/callback[?next=%2Fauth%2Fupdate-password]`, which the allow-list would have rejected. I changed `site_url` to `http://localhost:3000` and the allow-list to the wildcard `http://localhost:3000/**`, because the reset URL's encoded query string defeats exact matching.
3. **Migrations.** `npx supabase start` pulled the images and applied migrations 001–013 in order with no errors. This was previously untested, since production received them one by one through the SQL editor. The only notice was the expected "no files matched pattern: supabase/seed.sql".
4. **Wrong keys in `.env.local`.** The user's anon key (28 characters) and service key (36 characters) matched neither the legacy JWTs nor the new `sb_publishable_`/`sb_secret_` keys from `supabase status -o env`. I rewrote only those two lines from that output using a Node script, so key values never appeared in the transcript, and used the legacy JWT `ANON_KEY` and `SERVICE_ROLE_KEY`, which `@supabase/ssr` 0.6.1 fully supports. The URL and site URL were already correct.
5. **Google Fonts failing in dev.** Logs showed "Error while requesting resource … Failed to download `Cormorant Garamond`/`DM Sans`", so the site fell back to system fonts. Diagnosis:
   - `NODE_EXTRA_CA_CERTS=C:\ProgramData\Norton\Antivirus\wscert.pem` is set: Norton re-signs HTTPS.
   - Plain Node `https` honors that variable, which is why direct requests (about 400 ms) and `next build` (webpack loader) worked.
   - `next dev --turbopack` fetches fonts in Rust, which ignores it.

   Fix: `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` in `.env.local`. Next 15.5 supports it; see `turbopackUseSystemTlsCerts` in `config-schema.js`. It makes Turbopack trust the Windows certificate store, where Norton installs its root. I chose the machine-local env file over `experimental.turbopackUseSystemTlsCerts` in `next.config.ts` because the problem is specific to this machine. The same interception explains the earlier `npx` `UNABLE_TO_VERIFY_LEAF_SIGNATURE` / ETARGET failure.

*Side effects / contracts.* None for the app or production. `supabase/config.toml` affects only the local stack. The user should commit `config.toml` and `supabase/.gitignore` so other machines and agents get the same local auth settings.

**Verification**
- `npx supabase start`: all 13 migrations applied, exit 0.
- `.env.local` URL and keys compared programmatically against `supabase status -o env`: all match.
- Dev server: `/`, `/services`, `/about`, `/book`, `/auth/login`, `/auth/signup`, and `/analytics` return 200.
  - `/` contains both social links and the Book button, with theme `cherry-studio` read from the local DB.
  - `/services` renders 14 price rows from the DB.
  - Signed-out `/analytics` carries a `NEXT_REDIRECT` to `/`, so `requireOwner` works.
  - After the TLS flag, every page references 2 woff2 font files and the dev log has no errors.
- Not done: signing up or booking in the browser. That is for the user to do as `gabs@example.com`.

**Open items / handoff**
- Optional `supabase/seed.sql` with sample open slots and a test client, so booking can be tested without manual setup.
- Instagram in-app browser testing (via a tunnel or a Vercel preview) is deferred by the user.

### [Claude 1] — 2026-10-24 11:58 EDT — Image script, cleanup, Flower pink, crop points, themed emails, sticky Book button, social icons

**Commits:** uncommitted (the user handles source control)
**Files touched:**
- New: `scripts/optimize-images.mjs`, `eslint.config.mjs`, `.github/workflows/ci.yml`, `src/components/book-cta-bar.tsx`, `src/components/social-links.tsx`
- Deleted: `.eslintrc.json`, `public/about/README.md`, `public/about/.gitkeep`, `public/branding/README.md`, `public/branding/.gitkeep`, `public/portfolio/README.md`
- Auth/authorization: `src/lib/auth.ts`, `src/app/{analytics,clients,settings}/page.tsx`, `src/app/{book,clients,services,settings}/actions.ts`, `src/app/api/google/{connect,callback,disconnect}/route.ts`
- UI: `src/app/page.tsx`, `src/components/site-header.tsx`
- Styles/theme: `src/app/globals.css`, `src/lib/themes.ts`
- Data: `src/lib/portfolio.ts`, `src/lib/notifications.ts`
- Tooling: `package.json`, `package-lock.json`
- Docs: `AGENTS.md`, `docs/PROJECT_ARCHITECTURE.md`

**Technical explanation**

*Image script.* `scripts/optimize-images.mjs`, exposed as `npm run images:optimize -- <input> [--out public/portfolio] [--max 2000] [--quality 80] [--force] [--dry-run]`.
- **Processing:** for each JPEG/PNG/WebP/AVIF/TIFF it runs `sharp(...).rotate()`, so EXIF orientation is baked into the pixels. It then applies `.resize({ fit: "inside", withoutEnlargement: true })` and `.webp()`.
- **Metadata:** sharp drops EXIF/GPS unless `withMetadata()` is called. I verified the output has `exif: false`.
- **Safety:** the script refuses `--out` equal to the input folder, skips outputs that are newer than their source unless `--force` is given, warns on filenames with spaces (the tag parser expects tag words), and prints registry lines to paste into `PORTFOLIO_FILE_NAMES`. HEIC is skipped with a warning because sharp's prebuilt libvips does not decode it.
- **Size choice:** I picked 2000px on the long edge. The largest display is the lightbox, `max-w-4xl` (896 CSS px), which at 2× DPR needs about 1800px wide.
- **Dependency:** `sharp@^0.35.5` added as a devDependency. Next.js keeps its own nested `sharp@0.34.5` for runtime optimization, and 0.35.5 is the version that fixes the advisory listed in S1.
- **Test:** three copies in the scratchpad went from 3.0 MB to 79 KB, 3.1 MB to 127 KB, and 1.6 MB to 46 KB. **It has not been run on repo images**, at the user's request.

*Cleanup.*
1. **Per-request session cache:** `getSessionProfile` is wrapped in React `cache()`. The layout, `SiteHeader`, the page, and actions now share one `auth.getUser()` plus one `profiles` query per request, where previously there were three or more.
2. **Owner helpers:** `getOwnerSession()` returns `{ user, profile } | null` and `requireOwner(redirectTo = "/")` redirects. These replace 14 copies of `profile.role !== "owner"`:
   - pages: analytics, clients, settings
   - actions: createSlot, updateSlot, deleteSlot, releaseSlot, updateServiceItem, setActiveTheme, and both clients actions
   - routes: Google connect, callback, disconnect

   Redirect targets and error strings are unchanged. `deleteSlot` used to guard `profile.id` with an `if`; it now always passes the owner's id, which is never null for an owner session. `bookSlot` and `cancelMyBooking` still use `getSessionProfile` because they need client sessions. The unused `createClient` import in the Google connect route is gone.
3. **Removed** the `.square-iframe-container` CSS (both blocks) and the five placeholder files in `public/`, which were publicly served. The portfolio README's naming guidance now lives in the script header.
4. **Lint:** `next lint` is replaced by `eslint .` with `eslint.config.mjs` (`FlatCompat` → `next/core-web-vitals`, the same rule set as the old `.eslintrc.json`). `@eslint/eslintrc` is added as an explicit devDependency. npm re-sorted `dependencies` alphabetically and bumped a few transitive dev packages (`@emnapi/*`) in the lockfile.
5. **Scripts:** `typecheck` (`tsc --noEmit`) and `images:optimize` added.
6. **CI:** a GitHub Actions workflow on Node 22 runs `npm ci`, lint, typecheck, build with placeholder Supabase env, and `npm audit --omit=dev --audit-level=high`. The audit step is `continue-on-error` until S1 is fixed.
7. **Correction to my earlier entry:** `tsconfig.tsbuildinfo` was already git-ignored by `*.tsbuildinfo`, so no change was needed.

*Flower pink.* `--primary` and `--sidebar-primary` changed from `#e889a8` to `#d96f93`. Contrast against `--background #fff8fb` goes from 2.34:1 to 3.02:1 (WCAG AA for large text and UI components). The user asked for "a little darker, not too much", so I took the smallest step that crosses 3:1. Decorative pastels (glows, slot borders as `rgb(232 137 168 / …)`) are unchanged, and the `themes.ts` swatch was updated.

*Crop points.* I rendered gridded, EXIF-rotated contact sheets of all 41 registered photos (scratchpad only, not committed) and measured the vertical center of each set's nail art.
- **Only Y matters:** all 41 are 3:4 portrait, and every container (1:1 tile, 4:5 tile and carousel, 4:5 or 16:10 lightbox) is wider than 3:4, so width always fills and only Y is cropped.
- **Why the nail-center value works:** with `object-position: X% Y%`, the image point at Y% aligns with the container point at Y%. So if Y is the nail-art center, that point stays visible in every aspect ratio.
- **Values:** 45%–66%. The old values were 38%–46%, and the default was 45%, which favored the client's sweatshirt over the nails. The new default for unlisted photos is `50% 58%`.

*Email colors and S2.* I added `EmailPalette` and a per-theme `email` object to `THEME_CATALOG`, mirroring the `globals.css` hex values. Flower's `muted` uses the pink-family secondary-foreground `#6b3d52` instead of the green muted-foreground, because it reads better as body text.
- **Shared layout:** `notifications.ts` now builds all four emails through `buildEmailHtml` (heading, body, CTA, optional footer) plus `appointmentDetailsHtml`.
- **Palette source:** the active theme's palette comes from `getActiveThemeId()`. That works in Server Actions and in the cron route handler, because `active_theme` has a public read policy and the function falls back to `cherry-studio` on any error.
- **Escaping:** every user-controlled value (client name, greeting, notes, plus time and location for consistency) now goes through `escapeHtml`. This fixes the injection half of S2. Length caps are still pending.
- **Unchanged:** wording and subjects. Subjects are plain text and are not escaped.

*Sticky Book button (`BookCtaBar`).* It sits as the last child of the home page column with `sticky bottom-3 md:bottom-6 mt-auto`. Why sticky and not fixed:
1. On mobile, `body` is a fixed-height flex column and the page scrolls inside `.app-scroll-region`. That design is what keeps the bottom nav pinned in Instagram's iOS WKWebView.
2. `PageMotion`'s `animate-page-enter` uses `animation-fill-mode: both`, which leaves a `transform` on an ancestor. Any `position: fixed` descendant would then be positioned relative to that ancestor instead of the viewport.

Sticky follows the nearest scroll container in both cases: the inner region on mobile, the window on desktop, where every ancestor is `overflow: visible`. I checked `SidebarInset`, the sidebar wrapper, `PageMotion`, and `.page-gradient`, and none of them clip.

Details:
- The wrapper is `pointer-events-none` with a `pointer-events-auto` button, so the empty strip doesn't block taps on gallery tiles.
- `mt-auto` pins it to the bottom when a filtered gallery is shorter than the screen.
- It must stay outside `ScrollReveal`, whose `overflow: hidden` would capture sticky.
- `.book-cta-glow` adds a themed border and a halo in `globals.css`.

*Social icons.* `SocialLinks` renders 32px icon-only links using lucide `Instagram` and an inline TikTok glyph (lucide has no TikTok icon), with `aria-label` and `title`. URLs come from `aboutContent.social`. `SiteHeader` gained an optional `actions` prop, rendered between the title and the mobile sign-in link at every screen size, and only the home page passes it.

**Verification**
- `npm run lint` (new ESLint CLI): pass. Confirmed the Next.js rules are active: `--print-config` shows 23 `@next/next` and `react-hooks` rules, and a temporary probe file with an `<img>` tag triggered `no-img-element`. The probe was deleted.
- `npm run typecheck`: pass.
- `npm run build` with placeholder Supabase env: pass, all 20 routes.
- Image script: dry-run, real run, re-run skip, and the same-folder guard all tested on scratchpad copies; output has no EXIF and correct orientation.
- **Not checked in a browser:** this machine has no `.env.local`. Still to check:
  - the sticky button in Instagram's in-app browser on iOS and Android
  - the header icons at 320px width when signed out
  - the emails in a real inbox

**Open items / handoff**
- Run `images:optimize` on the portfolio after the 2026-10-25 meeting. It renames `.jpeg` to `.webp`, so update the registry and focal keys, and delete the originals from `public/`.
- Supabase auth email templates still use the old red; update them after the rebrand and re-paste them into the Supabase dashboard.
- Security: S1 (`npm audit fix`) and S2 length caps are still open, along with S3–S9.
- Local Supabase setup proposed to the user and not started. See the user-facing reply for steps.
- Loyalty program and rebrand inputs: see §2.6.

### [Claude 1] — 2026-10-24 11:04 EDT — Remove dark mode, theme-aware header shadow, architecture doc refresh, CLAUDE.md

**Commits:** uncommitted
**Files touched:**
- UI: `src/components/site-header.tsx`, `src/components/clients/clients-list.tsx`
- Styles: `src/app/globals.css`
- Docs: `docs/PROJECT_ARCHITECTURE.md`, `CLAUDE.md` (new), `AGENTS.md`

**Technical explanation**

*Intent.* The user asked to (1) add a `CLAUDE.md` so Claude Code sessions find this log automatically, (2) remove dark mode, (3) make the mobile header shadow follow the active theme, and (4) bring the architecture doc up to date and record security and architecture recommendations.

*Dark mode removal.* The site never had a dark theme. Theming is entirely owner-selected light palettes driven by `<html data-theme>`. The only dark-mode code was the Tailwind v4 `@custom-variant dark (&:is(.dark *));` declaration at the top of `globals.css` and three `dark:text-*` classes in `clients-list.tsx` (the success message and the verified/unverified badges). Nothing ever set a `.dark` class, so these were dead code. I removed the variant declaration and the three classes. Light-mode colors are unchanged (`text-emerald-800`, `text-amber-900` on tinted backgrounds). With the variant gone, Tailwind v4 falls back to its default `dark:` = `prefers-color-scheme: dark` behavior. **Any `dark:` class added later would therefore activate on users' OS dark setting, so don't add them** (also noted in §2.5).

*Header shadow.* `site-header.tsx` had `max-md:shadow-[0_4px_24px_-12px_rgb(140_207_155_/_0.45)]`, a hardcoded pastel green that matched only the Flower theme's accent (`#7bc88a`). I replaced it with a new `.site-header-shadow` class inside the existing `@media (max-width: 767px)` block in `globals.css`, next to `.mobile-ambient-bg`. It uses `box-shadow: 0 4px 24px -12px color-mix(in srgb, var(--accent) 45%, transparent)`. Same geometry and opacity as before, so Flower looks essentially identical, Cherry Studio now gets a champagne-gold glow, and Pearl gets lavender. I used a CSS class instead of a Tailwind arbitrary value because every other theme-derived `color-mix` effect in the codebase lives in `globals.css` (`.pill-nav-shell`, `.sidebar-hover-tab`, `.profile-card`), and that keeps tokenized effects in one place. It stays mobile-only, matching the original `max-md:` scope. Compiled output checked: Lightning CSS emits a plain `var(--accent)` fallback followed by the `color-mix` rule.

*CLAUDE.md.* Three lines that send Claude Code to `AGENTS.md` and the architecture doc. Claude Code loads `CLAUDE.md` automatically but not `AGENTS.md`, so without this pointer new sessions would skip the protocol.

*Architecture doc.* Added:
- phases 10–11
- updated directory tree (AGENTS.md, CLAUDE.md, middleware, email templates, migrations 001–013)
- theming notes (no dark mode, everything token-driven)
- a post-013 RLS read-model table in §9
- `get_taken_slots` in the booking RPC table and the client calendar data path in §10
- migration 013 in §11
- §15 split into "Controls in place" and an "Open security gaps" table (S1–S9, severity-ranked)
- `NEXT_PUBLIC_OWNER_PHONE` and a Verification subsection in §16
- current state of the staged photos, the uppercase `.JPEG` middleware-matcher miss, and image weight in §17.4
- new §17.14 on the over-broad client read access fixed by 013
- security, image, and architecture follow-ups in §20
- updated appendix tables and footer

Every S-item was verified against code:
- S1: `npm audit --omit=dev` output and installed `next` 15.5.19, with 15.5.28 available.
- S2: `notifications.ts` lines 70–100 interpolate `details.clientName` and `details.notes` raw, and migrations impose no length cap on notes.
- S3: `next.config.ts` has only `redirects()`.
- S4: `api/google/connect` passes `user.id` as `state`.
- S5: `updatePassword` requires 6+ characters.
- S6: `clients/actions.ts` reads `email` from FormData.
- S7: actions return `error.message`.
- S8: the cron route uses `!==`.
- S9: `owner_integrations.google_refresh_token` is plaintext.

*Side effects / contracts.* New CSS class `.site-header-shadow`, mobile only. No props, env vars, schema, or routes changed.

**Verification**
- `npm run lint`: pass (no warnings or errors).
- `npm run build`: compile and type-check pass. Static generation failed on `/auth/forgot-password` with "Supabase is not configured" because this machine has no `.env.local`. This is unrelated to these edits (see §2.5).
- Not visually checked in a browser (needs Supabase env to run). The change is mechanical, but check the header shadow on mobile across all three themes once env is available.

**Open items / handoff**
- Security backlog S1–S9 in `docs/PROJECT_ARCHITECTURE.md` §15. Recommended order: S1 (`npm audit fix`), S2 (escape email HTML and cap input lengths), S3 (security headers), S4 (OAuth state nonce).
- Image optimization pipeline for `public/portfolio/` (not started; options given to the user).
- Remove the `.square-iframe-container` dead CSS; git-ignore `tsconfig.tsbuildinfo`.

### [Claude 1] — 2026-10-24 10:55 EDT — Codebase review and creation of AGENTS.md

**Commits:** uncommitted
**Files touched:**
- Docs: `AGENTS.md` (new)

**Technical explanation**

*Intent.* The user is preparing a large visual and informational overhaul of the site and asked for (a) a full review of the codebase so agents understand the project, and (b) a shared log where every agent records in-depth notes on its changes, so work stays visible across multiple concurrent agents.

*Review performed.* I read `docs/PROJECT_ARCHITECTURE.md` in full, all 69 commits of history, `package.json`, `vercel.json`, `next.config.ts`, and `.env.example`. I then focused on the presentation layer the overhaul will touch: `src/app/layout.tsx`, `src/app/globals.css` (all 640 lines, every token block and utility), `src/lib/themes.ts`, `src/lib/theme.ts`, the Portfolio, About, and Services pages, `app-sidebar.tsx`, `mobile-bottom-nav.tsx`, `site-header.tsx`, `page-motion.tsx`, the portfolio components, `services-menu.tsx`, `src/lib/portfolio.ts`, `src/lib/data.ts`, and `src/lib/site-metadata.ts`. I also checked the two commits made after the architecture doc was written (`1d8d878`, `4578c0b`) and the staged-but-uncommitted portfolio images.

*Mechanism of the log file.* `AGENTS.md` sits at the repo root, where both humans and agent tools expect to find agent instructions. It has three parts:
1. **Protocol (§1):** naming (`Claude N`, numbered per session, plus a roster to prevent number collisions), required fields (agent, date, time in US Eastern to match the business timezone used throughout the code, commits, files, technical explanation, verification, handoff), a rubric for what counts as a strong technical explanation, house rules (newest first, never edit another agent's entry, flag overlapping files, keep the architecture doc in sync, no secrets), and a copy-paste template.
2. **Orientation (§2):** a condensed map aimed at the overhaul. It tells an agent where each visual concern lives (tokens, theme catalog, DB-driven active theme, fonts, motion, nav shell, effects, portfolio registry, content sources) and lists owner-confirmed constraints that must not be undone silently. This complements `docs/PROJECT_ARCHITECTURE.md` rather than duplicating it.
3. **Log (§3):** reverse-chronological entries.

*Decisions.*
- I chose newest-first ordering so a new agent sees current state immediately. Appending at the bottom would reduce merge conflicts slightly, but readability matters more for a file that is read far more often than it is written.
- I put orientation in this file instead of only linking to the architecture doc. That doc ends at migration 012 and doesn't cover the overhaul-relevant gotchas found in this review, so a short, dated "known state" section is more useful at the point of entry.
- I chose US Eastern for timestamps because the whole app is pinned to `America/New_York`, which avoids mixed-timezone entries.

*Findings recorded for the overhaul (details in §2.5).* The architecture doc is out of date (missing migration 013 and the phone env var). Seven staged `Gabby Nails-*.JPEG` photos are unregistered and would produce the title `"Gabby Nails-"` with no tags. The portfolio is about 139 MB of unoptimized full-resolution JPEGs. There is leftover Square CSS and a mostly unused `dark` variant. The mobile header shadow uses a hardcoded green that ignores the theme.

*Side effects / contracts.* None. This is documentation only; no runtime code, styles, schema, or environment changes.

**Verification**
- No code changed, so lint/build were not run.
- Every factual claim in §2.5 was checked against the working tree on 2026-10-24: `git status`, `ls public/portfolio`, grep for `square-iframe` and `dark:`, a manual trace of `titleFromFileName` on the staged filenames, and `du -sh public/portfolio`.

**Open items / handoff**
- Decide how the seven `Gabby Nails-*.JPEG` photos get titles and tags; this needs the owner's input on what each set is.
- `docs/PROJECT_ARCHITECTURE.md` needs migration 013 and `NEXT_PUBLIC_OWNER_PHONE` added; it can be done as part of the overhaul.
- Claude Code automatically loads `CLAUDE.md`, not `AGENTS.md`. A one-line `CLAUDE.md` pointing here would make future Claude sessions read this file without being told to.
