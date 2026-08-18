# NailsByGabs

Premium nail salon website with Supabase auth and appointment slot booking (no payments on-site).

## Getting started

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_services_and_google.sql` (editable prices + Google sync)
   - `supabase/migrations/003_owner_notifications.sql` (app_config read policy for notifications)
   - `supabase/migrations/004_update_services_menu.sql`
   - `supabase/migrations/005_owner_manual_booked_name.sql` (manual booked name on slots)
   - `supabase/migrations/006_site_theme.sql` (owner-selectable site color presets)
3. In **Table Editor → app_config**, set `owner_email` to Gabs’s sign-up email (this account gets the **owner** role).
4. Under **Authentication → URL Configuration**:
   - **Site URL:** `https://nailsbygabs.org` — **not** localhost in production
   - **Redirect URLs:** add:
     - `https://nailsbygabs.org/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev only)
5. **Email confirmation (recommended after SMTP):** By default, turn **off** confirm email while Supabase’s built-in mail limit is an issue:
   - **Authentication → Providers → Email** → disable **Confirm email**
   - New signups can book immediately without a verification link.
   - When **Brevo + nailsbygabs.org** is configured (see below), turn **Confirm email** back on and restore templates from `supabase/email-templates/`.
6. Copy **Project URL** and **anon public** key into `.env.local` (see `.env.example`).

### Auth email via Brevo + nailsbygabs.org

1. **Brevo** → Settings → **Domains** → add `nailsbygabs.org` → add DNS records in **Cloudflare** → wait until **Authenticated**.
2. **Brevo** → **Senders** → add `noreply@nailsbygabs.org` (From name: `NailsByGabs`).
3. **Supabase** → **Project Settings** → **Authentication** → **SMTP** (custom SMTP on):
   - Host: `smtp-relay.brevo.com` · Port: `587` · User: Brevo login email · Password: Brevo **SMTP key**
   - **Sender email:** `noreply@nailsbygabs.org` · **Sender name:** `NailsByGabs`
4. **Authentication** → **URL Configuration** → Site URL `https://nailsbygabs.org`, redirect `https://nailsbygabs.org/auth/callback`
5. **Email Templates** → paste `confirm-signup.html` and `reset-password.html` from `supabase/email-templates/`
6. **Providers → Email** → **Confirm email** ON · test signup

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
3. Set **`NEXT_PUBLIC_SITE_URL`** to `https://nailsbygabs.org` for the **Production** environment. This is what confirmation emails use — if it is missing or set to localhost, verify links will break.
4. Redeploy after changing env vars.
5. In Supabase, set **Site URL** to `https://nailsbygabs.org` and confirm `/auth/callback` is in **Redirect URLs**.

## Booking flow

| Role | Capabilities |
|------|----------------|
| **Owner** (Gabs’s email in `app_config`) | Create/delete slots, release bookings, see all appointments, manage clients, switch site theme |
| **Client** (any registered user) | Reserve open slots with optional notes; other bookings show as **Taken**; cancel own bookings |

No business-hours rules — Gabs sets each slot’s start and end manually.

## Owner features

- **Editable prices:** Sign in as owner → Services & Pricing → edit and save each row.
- **Calendar views:** Book Appointment → Week / Month toggle.
- **Client add-to-calendar:** After booking, use Google Calendar link or download `.ics`.
- **Owner Google sync (optional):** Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel, then owner clicks **Connect Google Calendar** on the book page. Slots sync to Gabs’s Google Calendar automatically.

### Google Calendar setup

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → enable **Google Calendar API**.
2. Create **OAuth 2.0 Client ID** (Web application).
3. Authorized redirect URI: `https://nailsbygabs.org/api/google/callback`
4. Add to Vercel env vars and redeploy:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → **service_role** secret; server-only — needed so client bookings update Gabs’s calendar)
5. Owner signs in → Book Appointment → **Connect Google Calendar**.

### Owner booking email notifications (free)

Automated texts (Twilio, etc.) require a paid service — there isn’t a reliable free SMS option for apps. Instead, Gabs gets an **email** when someone books (works great on phone mail apps).

Uses [Resend](https://resend.com) — **3,000 emails/month free**, no credit card needed to start.

1. Sign up at Resend → create an API key.
2. In Vercel env vars, set:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (optional; one line: `NailsByGabs <onboarding@resend.dev>` — no line breaks)
   - `OWNER_NOTIFICATION_EMAIL` (optional) — or set **`owner_notification_email`** in Supabase `app_config` (falls back to **`owner_email`**)
3. Redeploy and book a test appointment.

Owner emails include client name, time, notes, and a link to the calendar when someone **books** or **cancels**. Clients who book online also receive a **confirmation email** to the address on their account (same Resend API key).

### Site appearance (owner)

Gabs can switch the whole site between **Cherry Studio**, **Pearl**, and **Night Chrome** from **Appearance** in the sidebar (or **Theme** on mobile). The active preset is stored in Supabase `app_config` (`active_theme`) and applies to every visitor.

Run `supabase/migrations/006_site_theme.sql` if the Appearance page cannot save themes.

## Customize content

Edit `src/lib/data.ts` for about page and social links. Add portfolio images under `public/portfolio/` (coming next).
