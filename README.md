# Community Music Band — Full-Stack Decoupled CMS Application

> **Final Project / Final Lab Exam Project**
> An enhanced decoupled full-stack web application featuring a **Laravel Headless REST API (CMS A)** and a **React + TypeScript SPA (CMS B)**.
> Meets the requirement of **≥40% database-driven CMS content** serving 2026 performance, concert, and season schedule data.

---

## 🏛️ Architecture Overview

```
                      +---------------------------------------+
                      |         CMS B: React + TypeScript      |
                      |            Vite Development Server    |
                      |            http://localhost:5173      |
                      +---------------------------------------+
                           |                              |
         GET /api/performances            GET /api/performances/{id}
       (IndexPage / Home Schedule)             (DetailPage)
                           |                              |
                           v                              v
                      +---------------------------------------+
                      |          CMS A: Laravel REST API      |
                      |          http://127.0.0.1:8000        |
                      +---------------------------------------+
                                          |
                                    Eloquent ORM
                                          |
                                          v
                              [ XAMPP MySQL Database ]
                               (community_band_db)
                              Viewable via phpMyAdmin
                             http://localhost/phpmyadmin
```

The same API also serves `/api/home`, `/api/about`, and `/api/settings` for CMS-managed page copy,
settings, events, and testimonials.

The root project is the canonical application. The earlier duplicate `frontend/` app was archived
in the Git tag `archive/frontend-legacy`, and then removed from the working tree so there is only
one frontend to maintain and deploy.

---

## 🚀 Quick Start & Installation (For Video Demo)

### 1. Backend Setup (Laravel API — Port 8000)
```bash
# Navigate to the backend directory
cd backend

# Install PHP dependencies
composer install

# Prepare environment file (if not already present)
cp .env.example .env
php artisan key:generate

# Execute migrations and seed the CMS content
php artisan migrate --seed

# Create the administrator account and write a one-time setup link
php artisan admin:setup-link

# Start the Laravel headless REST API
php artisan serve
# -> Listening on http://127.0.0.1:8000
```

### 2. Frontend Setup (React + TypeScript — Port 5173)
```bash
# In a new terminal, stay in the project root (the canonical app)
# Install node dependencies
npm install

# Start the Vite development server
npm run dev
# -> Local URL: http://localhost:5173/
```

---

## 📋 CMS API Specifications (CMS A)

| Method | Endpoint | Description | Response Type |
|---|---|---|---|
| `GET` | `/api/home` | Returns ordered home sections and items, server-hydrated events/testimonial records, and the next published performance | JSON page (`{ data: { page, sections, next_performance } }`) |
| `GET` | `/api/about` | Returns ordered About page sections and items | JSON page (`{ data: { page, sections } }`) |
| `GET` | `/api/settings` | Returns public site settings as a flat key/value map | JSON object (`{ data: { "site.name": "..." } }`) |
| `GET` | `/api/performances` | Returns published, non-deleted performances sorted by date and start time | JSON collection (`{ data: [...] }`) |
| `GET` | `/api/performances/{id}` | Returns full details for a published performance | JSON resource (`{ data: {...} }`) |
| `GET` | `/api/stories` | Returns published, non-deleted Stories sorted newest first | JSON collection (`{ data: [...] }`) |
| `GET` | `/api/stories/{slug}` | Returns one published Story by slug | JSON resource (`{ data: {...} }`) |

Page text, FAQ, and timeline content live in `home_sections` / `home_section_items` and
`about_us_sections` / `about_us_section_items`. Contact details, rehearsal times, social links,
and SEO metadata live in `site_settings`. Testimonials and performances have their own tables and
soft deletes. The public API only returns visible/published content.

### Admin CMS, Stories, and password resets

- The in-site CMS lives at `/admin`. The administrator email is
  `Communitymusicband@gmail.com`; the password is never printed or committed.
- Run `php artisan admin:setup-link` from `backend/` to create the account (if needed) and
  write a signed, single-use setup link to
  `backend/storage/app/private/admin-reset-link.txt`. The link expires after 60 minutes.
- `/admin/forgot-password` prepares the same kind of link. After opening it, choose a new
  password of at least 10 characters. The link is consumed after one successful reset.
- Admin sessions use Sanctum bearer tokens and expire after eight hours by default
  (`SANCTUM_EXPIRATION=480`). Admins can edit/reorder/hide Home and About sections and items,
  manage Settings, and create/edit/soft-delete performances, testimonials, and Stories.
- Stories are public at `/stories` and `/stories/:slug`; `/blog` redirects to `/stories`.
  The three seeded Stories are clearly labelled samples and stay unpublished until an
  administrator reviews and publishes them.
- The Daytime/Evening palette is defined as semantic tokens in `src/index.css`. Colour
  choices are documented in `design-system/community-music-band/MASTER.md`.

The admin API is grouped under `/api/admin`:

- `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`
- `GET /api/admin/home` and `GET /api/admin/about`; section/item edits and reordering use
  the matching `PUT` routes, and settings are saved through `/api/admin/settings`
- `GET|POST|PUT|DELETE /api/admin/{performances|testimonials|stories}`
- `POST /api/admin/forgot-password` prepares a link; `POST /api/admin/reset-password`
  consumes it once

### Performance Model Schema (`performances` table)
- `id` (bigint, auto-increment)
- `title` (string) — Performance/event title
- `performance_date` (date) — Event date (`YYYY-MM-DD`)
- `start_time` (time, nullable) — Event start time (`HH:MM`)
- `event_type` (string) — Category (Concert, Parade, Outdoor Festival, Community Outreach, Charity Gala)
- `venue` (string) — Hall, park, or center name
- `city` (string) — City name
- `duration_minutes` (integer) — Duration in minutes
- `conductor` (string) — Musical director / conductor name
- `description` (text) — Detailed performance synopsis
- `is_published` (boolean) — Public visibility flag
- `deleted_at` (timestamp, nullable) — Soft-delete marker
- `created_at` / `updated_at` (timestamps)

The seeded 2026 Pampanga performance schedule is sample data. It is labelled in
`site_settings` (`performances.sample_notice`) and in the Home events section so it can be replaced
with the band's real dates before the site is promoted.

---

## 🖥️ CMS Features in Frontend (CMS B)

1. **2026 Season Schedule (`/performances` / `IndexPage.tsx`):**
   - Live query to Laravel REST API `GET /api/performances`.
   - Real-time event category filtering (Concert, Parade, Outdoor Festival, Community Outreach, Charity Gala).
   - Instant search across titles, venues, conductors, and cities.
   - Interactive cards with date blocks, category badges, metadata, and link to `/detail/:id`.
2. **Performance Detail Page (`/detail/:id` / `DetailPage.tsx`):**
   - Dynamic parameter extraction via `useParams()`.
   - Live query to `GET /api/performances/:id`.
   - Full venue, conductor, duration, logistics, and program notes.
   - Direct back navigation links to `/` and `/performances`.
3. **Dynamic Home Page (`/` / `Home.tsx`):**
   - Renders the ordered `home_sections` payload from `GET /api/home` through a typed section registry.
   - Hero "Next Concert" badge uses the server-computed `next_performance`.
   - "2026 Concerts & Performances" section displays published performances with a visible sample-data notice.
   - Loading, empty, and retry states keep the page usable if the API is unavailable.
4. **Dynamic About Page (`/about` / `About.tsx`):**
   - Renders `about_us_sections` and their items through a typed section registry.
   - Profile, mission, timeline, values, impact, FAQ, and join content are fully CMS-driven.
   - Contact and rehearsal details come from `GET /api/settings`.
5. **Instrument Gallery (`/instruments` / `Instruments.tsx`):**
   - Organises all 17 local instrument photographs into woodwinds, brass, strings, and percussion.
   - Includes the Home page's "Every sound has a place" programme teaser.
   - Instrument images are optimised WebP assets under `src/assets/instruments/`.
6. **CMS-managed Settings:**
   - The navbar, footer, contact details, social links, and page SEO metadata read from `GET /api/settings`.
   - Public pages fall back to seeded defaults while the settings request is in flight.
7. **In-site Admin CMS (`/admin` / `AdminDashboard.tsx`):**
   - Sanctum-protected sign-in, session restore, sign-out, and a one-time password reset flow.
   - Home/About section and item editors with visibility toggles and safe reordering.
   - Full create/edit/soft-delete management for performances, testimonials, and Stories.
   - Settings editor for contact details, navigation, SEO, and public notices.
8. **Stories (`/stories` / `Stories.tsx`):**
   - "Notes from the Bandstand" index and article pages driven by the public Stories API.
   - Unpublished drafts stay off the public site; `/blog` redirects to `/stories`.
   - Seeded sample Stories are labelled in the admin and never published automatically.

---

# Original Project Overview

- **Front end:** React 19, Vite, Tailwind CSS v4 (utility-first), React Router
- **Donation API:** a small Express server in `server/` that creates Stripe PaymentIntents
- **Design:** "Golden Hour at the Bandstand" — see `design-system/community-music-band/MASTER.md`

## Getting started

```bash
npm install
cd server && npm install && cd ..   # one-time: installs the donation API deps

cp .env.example .env                # then paste your Stripe *test* publishable key
cp server/.env.example server/.env  # then paste your Stripe *test* secret key

npm run dev                         # site on :5173, API on :4242
```

Both keys come from <https://dashboard.stripe.com/test/apikeys>. They must belong to the same
Stripe account, and test cards (e.g. `4242 4242 4242 4242`) only work in test mode.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite (web), the donation API, **and** the Stripe CLI forwarder together |
| `npm run dev:web` | Vite only |
| `npm run dev:api` | Donation API only |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over `src/`, `server/` and `scripts/` |
| `npm test` | Vitest (runs once) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run format` | Prettier, write |
| `npm run format:check` | Prettier, check only (what CI runs) |
| `npm run ledger` | Print a summary of recorded donations |
| `cd backend && php artisan test` | Laravel feature and unit tests |
| `cd backend && vendor/bin/pint --test` | Laravel PHP style check |

CI (`.github/workflows/ci.yml`) runs on every push and pull request:

- **Web app:** format, lint, TypeScript, Vitest (including the donation API tests), build, and
  production dependency audits.
- **Laravel API:** Composer validation and install, PHP style, dependency audit, and the full
  test suite.
- **MySQL migration smoke:** migrations plus seeders against MySQL 8, then a repeat migration
  check to confirm the schema is idempotent.

### Environment variables

| Variable | File | Purpose |
| --- | --- | --- |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `.env` | Stripe publishable key (`pk_test_...` or `pk_live_...`) used by the browser |
| `VITE_API_URL` | `.env` | Optional. Donation API base URL. Defaults to `http://localhost:4242` |
| `STRIPE_SECRET_KEY` | `server/.env` | Stripe secret key (`sk_test_...` or `sk_live_...`) used by the API — never expose this one |
| `STRIPE_WEBHOOK_SECRET` | `server/.env` | Optional. Signing secret for `/stripe-webhook`. Without it the API still takes donations, it just cannot record them |
| `PORT` | `server/.env` | Optional. API port. Defaults to `4242` |
| `CORS_ORIGINS` | `server/.env` | Optional. Extra comma-separated origins allowed to call the API |
| `TRUST_PROXY` | `server/.env` | Optional. How many proxy hops to believe, e.g. `1` behind nginx. Without it the API only ever sees the proxy's address, so every donor shares one rate-limit bucket |
| `DONATIONS_FILE` | `server/.env` | Optional. Where the donation ledger is written. Defaults to `server/data/donations.jsonl` |
| `GMAIL_USER` | `server/.env` | Optional. Google account that sends the donation alerts |
| `GMAIL_APP_PASSWORD` | `server/.env` | Optional. 16-character App Password for that account. Requires 2-Step Verification |
| `DONATION_NOTIFY_TO` | `server/.env` | Optional. Where alerts are sent. Defaults to `GMAIL_USER` |
| `SMTP_FALLBACK_HOST` | `server/.env` | Optional. A second free SMTP relay tried when Gmail fails. Setting this turns the fallback on |
| `SMTP_FALLBACK_PORT` | `server/.env` | Optional. Relay port. Defaults to `587` |
| `SMTP_FALLBACK_USER` / `SMTP_FALLBACK_PASSWORD` | `server/.env` | Optional. Relay credentials. Brevo's Login is a dedicated value like `9f3a2b1c@smtp-brevo.com`, not your account email; the password is the SMTP key |
| `SMTP_FALLBACK_FROM` | `server/.env` | Optional. Verified sender for the relay. Defaults to `GMAIL_USER` |
| `SMTP_FALLBACK_SECURE` | `server/.env` | Optional. `true` for port 465. Defaults to `false` (STARTTLS on 587) |
| `PENDING_ALERTS_FILE` | `server/.env` | Optional. Where undelivered alerts wait. Defaults to `server/data/pending-alerts.jsonl` |

Every `.env` file is git-ignored; copy the matching `.env.example` to create them.

The Laravel CMS also reads:

| Variable | File | Purpose |
| --- | --- | --- |
| `FRONTEND_URL` | `backend/.env` | Public SPA origin used when building one-time admin reset links |
| `FRONTEND_URLS` | `backend/.env` | Comma-separated browser origins allowed by CORS |
| `SANCTUM_EXPIRATION` | `backend/.env` | Admin token lifetime in minutes. Defaults to `480` (8 hours) |
| `ADMIN_EMAIL` | `backend/.env` | Administrator email. Defaults to `Communitymusicband@gmail.com` |
| `ADMIN_NAME` | `backend/.env` | Display name for the administrator account |

`php artisan admin:setup-link` creates the account if it is missing, but it never prints a
password. It writes the setup link to `storage/app/private/admin-reset-link.txt`; open that
file locally and use the link in the browser.

The API accepts any `localhost`/`127.0.0.1` origin on any port, so donations keep working when Vite
falls back to `5174` because `5173` was already taken.

## How donations work

1. The browser posts the amount and the donor's name and email to
   `POST /create-payment-intent` with an `Idempotency-Key` derived from those details, so a
   double-click or a retry cannot charge twice.
2. The API validates the amount (`$1`–`$1000`) and creates the PaymentIntent with Stripe. Card
   details are collected by Stripe's Payment Element in its own iframe and go straight to Stripe —
   they never reach this server.
3. The browser confirms the payment with Stripe and shows a receipt built from the amount **Stripe
   confirmed**, not the amount that was typed in.
4. Stripe calls `POST /stripe-webhook` on completion. The signature is verified against
   `STRIPE_WEBHOOK_SECRET` before anything is written to an append-only JSONL ledger at
   `server/data/donations.jsonl`, deduplicated by PaymentIntent id so Stripe's retries cannot
   double-count a gift.
5. If Gmail alerts are configured, that same verified webhook emails the band. The ledger's
   dedupe is what keeps it to one alert per gift, and anything the mailer cannot deliver is
   queued and retried rather than dropped.

### Recording donations locally

`npm run dev` starts the Stripe CLI forwarder as a third process (tagged `[stripe]`), so a completed
donation reaches the API without you having to remember anything extra. If the CLI is not installed it
is skipped with a note, and you start it yourself:

```bash
stripe listen --forward-to localhost:4242/stripe-webhook --events payment_intent.succeeded
```

Recent Stripe CLI versions refuse to start without an explicit event list (`--events`, or
`--all-snapshot`/`--all-thin` for everything). `payment_intent.succeeded` is the only event this API
records, so listing it keeps the output readable. The listener must stay running for gifts to be
recorded — the signing secret only lets the API verify deliveries, it does not pull them in. A
donation made while the listener is down still succeeds at Stripe, but the API never hears about it:
nothing is written to the ledger and no email is sent.

Copy the `whsec_...` value it prints into `server/.env` as `STRIPE_WEBHOOK_SECRET` and restart the
API. `GET /health` reports `"webhooks": true` once it is wired up. Then:

```bash
npm run ledger
```

The API also exposes `GET /health` (shows the configured currency, limits, and whether the ledger
and webhook are active), logs every request, and rate-limits donation attempts per IP.

### Emailing the band when a gift lands

Optional. The API can email you whenever a donation is confirmed — sandbox gifts included, because
the API sends the mail itself rather than Stripe.

1. Turn on **2-Step Verification** for the Google account (<https://myaccount.google.com/security>).
   Google will not issue an App Password without it.
2. Create an **App Password** at <https://myaccount.google.com/apppasswords> and copy the 16
   characters.
3. Add to `server/.env`, then restart the API:

   ```
   GMAIL_USER=you@gmail.com
   GMAIL_APP_PASSWORD=thesixteenchars     # paste it without spaces
   DONATION_NOTIFY_TO=you@gmail.com       # optional, defaults to GMAIL_USER
   ```

`GET /health` reports `"mail": true` once it is wired up, `"pendingAlerts": 0` while nothing is
waiting, and the boot log prints `Donation alerts: Gmail -> you@gmail.com` (never the password).
To test the setup without waiting for a donation, run `npm run check-mail` inside `server/` — it
prints what is configured, asks each transport to log in without sending anything, and reports the
provider's own words when one refuses. `npm run check-mail -- --send` delivers a real test alert.

The alert is driven by the webhook, so it needs `stripe listen` running locally, or a registered
endpoint in production — the signing secret alone does not deliver anything. A retried event never
sends a second email, because the alert is tied to the ledger's first-time record. If the mailer
cannot send, the alert is queued and retried rather than dropped, and the webhook still answers
`200`: answering with an error would only make Stripe replay an event that the dedupe then skips,
losing the alert for good.

Each alert comes from the sending account — `GMAIL_USER`, or `SMTP_FALLBACK_FROM` when a relay is
doing the sending — with `Reply-To` set to the donor, so replying thanks them directly. Sandbox
donations are prefixed `[TEST]` in the subject, since Stripe marks every test object with
`livemode: false`. Note that a personal Gmail account allows roughly 500 messages a day, and that mail
sent to donors from a personal address is more likely to be filed as promotions than mail sent from
your own address to yourself.

#### When the mail cannot go out

A gift is already safe in the ledger before an alert is attempted, so the alert is the only thing
that could be lost. Two layers stop that happening, and both are free.

**1. The retry queue — no setup at all.** Anything the mailer cannot deliver is written to
`server/data/pending-alerts.jsonl` and retried on a backoff: 1 minute, 5, 15, 1 hour, then every
6 hours. Each entry counts its attempts and keeps the last error, the queue is swept again on every
start, and it drains by itself once the cause is fixed. So a network blip, Gmail throttling, a
timeout or a restart mid-send delays an alert instead of losing it. `GET /health` shows the depth as
`pendingAlerts`, and the boot log names how many it is retrying. A queue that never drains means the
credentials are wrong — which is exactly the signal worth having.

**2. A relay — one free account, and it can be the only sender.** Any plain SMTP relay works; if no
Gmail account is configured at all, the relay simply becomes the sender:

| Provider | Free allowance | SMTP settings |
| --- | --- | --- |
| Brevo | 300/day, no time limit, no card | `smtp-relay.brevo.com`, port `587`, `SMTP_FALLBACK_SECURE=false` |
| Mailjet | 200/day (6,000/month) | `in-v3.mailjet.com`, port `587`, `SMTP_FALLBACK_SECURE=false` |

Brevo is what this project runs on, and three things there catch people out:

- **Use the Login shown on the SMTP page, not your account email.** Brevo issues a dedicated login such
  as `9f3a2b1c@smtp-brevo.com`, and the wrong value is refused with a generic `535 Authentication
  failed` — which deliberately hides whether the login or the key was at fault.
- **Mind the IP allowlist.** Brevo blocks unknown IP addresses by default on accounts created after
  16 May 2024, answering `525 5.7.1 Unauthorized IP address`. Authorise the sending machine under
  Settings → Security → Authorized IPs, or turn the blocking off. A deployed server has a different
  outbound IP and needs the same treatment, or alerts stop while quietly waiting in the queue.
- **The key is the SMTP key** (Settings → SMTP & API → SMTP) — not the API key, not the account
  password — and the sender address must be verified under Senders.

Gmail SMTP needs an App Password, which Google withholds or makes awkward on some new accounts, so a
relay-only setup is often the calmer choice. Confirm whichever you pick with `npm run check-mail`
inside `server/`: it prints what is configured, asks every transport to log in without sending
anything, and `npm run check-mail -- --send` delivers a real test alert.

Neither layer can invent a working channel: if every transport fails *and* nothing is configured,
the alert waits on disk instead of arriving. The honest summary is that the queue removes transient
failures as a concern, and the relay removes a Gmail outage as a concern.

## Testing

```bash
npm test
```

Vitest runs two suites with no extra test dependencies: server tests that boot the real app on an
ephemeral port and drive it over HTTP (amount parsing, rate limiting, CORS, the webhook with a real
Stripe signature, the ledger, the donation alert, its retry queue and its transport failover), and
unit tests for the client-side amount formatting and idempotency key.

The webhook tests inject a fake alert pipeline and the alert message is built as plain data, so the
suite needs no Gmail credentials and never opens an SMTP connection.

## Project layout

```
src/            React app (pages, components, theme tokens, typed data)
server/         Express + Stripe donation API (port 4242)
scripts/        dev server runner and the donation report
public/         static assets (favicon, social card, robots.txt, sitemap.xml)
design-system/  the design system the UI follows
```

## Before you deploy

- **Set your real domain.** `communitymusicband.example` is a placeholder in `index.html`
  (canonical, Open Graph, JSON-LD), `public/robots.txt` and `public/sitemap.xml`. Replace it in all
  three, then swap `og-image.jpg` for a fresh card if the tagline changes.
- **Add the real social URLs.** `src/data/landing.ts` currently points the footer icons at each
  platform's home page.
- Build with `npm run build` and serve `dist/`. Because this is a single-page app, configure your
  host to fall back to `index.html` for unknown paths, or refresh on `/about` will 404.
- Set `CORS_ORIGINS` to your live origin and use **live** Stripe keys (`pk_live_`/`sk_live_`).
  Stripe requires HTTPS for live payments. Both key kinds are accepted: with a live key the API
  prints a warning instead of refusing to start, and alert subjects lose their `[TEST]` prefix.
- **Set `TRUST_PROXY` if anything sits in front of the API.** Behind nginx, Apache or a platform
  router, `req.ip` is the proxy's address, so the donation rate limit would count every donor as
  one client and one busy visitor could throttle everybody. `TRUST_PROXY=1` means one hop.
- **Donation alerts** need a real webhook endpoint in the Stripe dashboard instead of
  `stripe listen`. Keep `GMAIL_APP_PASSWORD` out of the repo: GitHub's push protection does not
  recognise a 16-character Google App Password, so `.gitignore` is the only thing keeping it out.
- Serve the site over HTTPS — Stripe.js refuses live keys on plain HTTP.

## Accessibility

The UI targets WCAG 2.1 AA: token-driven light/dark themes with verified contrast, visible focus
outlines everywhere, a skip link, keyboard-only operation (including the mobile menu, which is
removed from the tab order with `inert` when closed), and `prefers-reduced-motion` support. The
donation form's success message is announced through an `aria-live` region.
