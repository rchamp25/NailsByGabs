# NailsByGabs

Premium nail salon website with Supabase auth and appointment slot booking (no payments on-site).

## Getting started

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the full script in `supabase/migrations/001_initial.sql`.
3. In **Table Editor → app_config**, set `owner_email` to Gabs’s sign-up email (this account gets the **owner** role).
4. Under **Authentication → URL Configuration**, add:
   - Site URL: `http://localhost:3000` (and your Vercel URL later)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://your-domain.vercel.app/auth/callback`
5. Copy **Project URL** and **anon public** key into `.env.local` (see `.env.example`).

### 2. Local dev

```bash
npm install
cp .env.example .env.local
# edit .env.local with your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Deploy on Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add the same env vars from `.env.local` in **Project Settings → Environment Variables**.
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://nailsbygabs.vercel.app`).
4. Add the production `/auth/callback` URL in Supabase redirect allowlist.

## Booking flow

| Role | Capabilities |
|------|----------------|
| **Owner** (Gabs’s email in `app_config`) | Create/delete slots, release bookings, see all appointments as e.g. *Maddy Brown's Nails* |
| **Client** (any registered user) | Reserve open slots with optional notes; other bookings show as **Taken**; cancel own bookings |

No business-hours rules — Gabs sets each slot’s start and end manually.

## Customize content

Edit `src/lib/data.ts` for services, about page, and social links. Add portfolio images under `public/portfolio/` (coming next).

## Later: email / SMS notifications

Not included in v1. Options when ready:

- **Email:** Supabase Auth hooks, Resend, or Vercel + React Email on new bookings
- **SMS:** Twilio when you want text alerts
