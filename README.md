# NailsByGabs

Premium nail salon website with Supabase auth and appointment slot booking (no payments on-site).

## Getting started

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the full script in `supabase/migrations/001_initial.sql`.
3. In **Table Editor → app_config**, set `owner_email` to Gabs’s sign-up email (this account gets the **owner** role).
4. Under **Authentication → URL Configuration**:
   - **Site URL:** your live Vercel URL (e.g. `https://nails-by-gabs.vercel.app`) — **not** localhost in production
   - **Redirect URLs:** add both:
     - `https://your-app.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev only)
5. **Friendly confirmation emails:** In **Authentication → Email Templates → Confirm signup**, paste the HTML from `supabase/email-templates/confirm-signup.html`. Set the subject to `Confirm your NailsByGabs account`.
6. Copy **Project URL** and **anon public** key into `.env.local` (see `.env.example`).

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
3. Set **`NEXT_PUBLIC_SITE_URL`** to your production URL (e.g. `https://nails-by-gabs.vercel.app`) for the **Production** environment. This is what confirmation emails use — if it is missing or set to localhost, verify links will break.
4. Redeploy after changing env vars.
5. In Supabase, set **Site URL** to the same production URL and confirm `/auth/callback` is in **Redirect URLs**.

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
