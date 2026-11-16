# Staging and Production Setup

This document is the host-agnostic deployment runbook for the Music Without Borders CMS. For the
current staging deployment using Railway and Vercel, follow [`docs/railway.md`](railway.md) first;
this page documents the environment contract, Brevo/Stripe checks, backups, and rollback. Vercel
cannot run Laravel, MySQL, or the Stripe donation API.

## Topology

| Piece | Recommended host | Notes |
| --- | --- | --- |
| React SPA | Vercel | Build with `npm run build`, output `dist/`. `vercel.json` adds the SPA fallback and security headers. |
| Laravel API | Railway (current staging), small VPS, Laravel Cloud, or managed PHP host | PHP 8.3+, Composer, writable `backend/storage` and `backend/bootstrap/cache`. Document root is `backend/public`. |
| MySQL | Same private network as the API, or Railway MySQL/managed MySQL 8 | Never expose the database port publicly. |
| Donation API | Railway (current staging) or a second small Node process | Node 24+. Keeps Stripe secret keys off the SPA. Mount persistent storage for the ledger. |
| Email | Brevo SMTP relay | Verify the sender address and authorize the API host's outbound IP. |
| DNS/TLS | Your domain registrar plus the hosts | HTTPS is required for Stripe live keys and secure cookies. |

## Environment

### Laravel (`backend/.env`)

Use these values for staging; replace the example hostnames and secrets. For production, change
`APP_ENV` to `production`, use the production domain, and switch Stripe to live keys.

```dotenv
APP_NAME="Music Without Borders"
APP_ENV=staging
APP_KEY=base64:generate-with-php-artisan-key-generate
APP_DEBUG=false
APP_URL=https://api-staging.example.com
APP_TIMEZONE=Asia/Manila
FORCE_HTTPS=true
# Required behind Railway's router so X-Forwarded-Proto/client IP are trusted.
TRUSTED_PROXIES=*
FRONTEND_URL=https://staging.example.com
FRONTEND_URLS=https://staging.example.com
SANCTUM_EXPIRATION=480
ADMIN_EMAIL=Communitymusicband@gmail.com
ADMIN_NAME="Music Without Borders Admin"
ADMIN_RESET_DELIVERY=mail
LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=music_without_borders
DB_USERNAME=music_without_borders
DB_PASSWORD=use-a-long-random-password

MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_SCHEME=null
MAIL_USERNAME=brevo-smtp-login
MAIL_PASSWORD=brevo-smtp-key
MAIL_FROM_ADDRESS=verified-sender@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

- `ADMIN_RESET_DELIVERY=mail` requires a real mailer. If `MAIL_MAILER` is `log` or `array`, the
  service deliberately falls back to private storage instead of writing a reset token to a log.
- `FRONTEND_URL` is used in the reset link. `FRONTEND_URLS` controls CORS and must contain the
  deployed SPA origin.
- `FORCE_HTTPS=true` adds HSTS even when TLS terminates at a proxy. Set `TRUSTED_PROXIES=*` only
  when the API is reachable exclusively through the platform router (for example Railway), so
  Laravel reads the original scheme and client IP from `X-Forwarded-*`.
- Generate `APP_KEY` once and keep it stable. Rotation invalidates signed reset links and encrypted
  data.
- `SANCTUM_EXPIRATION` is in minutes; `480` is eight hours.
- The admin mailbox still uses the existing address until a replacement inbox is provisioned. Change
  `ADMIN_EMAIL` only after that mailbox exists, or password recovery will break.
- The local database identifier used during development is `community_band_db`. That name is
  internal; the staging/production database can use `music_without_borders` without changing the
  application code.

### Frontend (Vercel)

| Variable | Example | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://api-staging.example.com/api` | Laravel CMS API; must include `/api`. |
| `VITE_API_URL` | `https://donations-staging.example.com` | Stripe donation API root; no trailing slash. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` for staging, `pk_live_...` for production | The publishable key is public by design; the secret key belongs only in the donation API. |

Import the repo into Vercel, keep the project root at the repository root, and use the detected Vite
build. `vercel.json` supplies the BrowserRouter fallback and security headers. Add the production
domain only after UAT.

### Donation API (`server/.env`)

```dotenv
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_dashboard
CORS_ORIGINS=https://staging.example.com
DONATION_NOTIFY_TO=Communitymusicband@gmail.com
TRUST_PROXY=1
```

For Brevo alerts, use the `SMTP_FALLBACK_*` block documented in `server/.env.example`. Keep the
donation ledger (`server/data`) on persistent storage if the webhook is enabled. The webhook must be
registered against the deployed URL, not the local `stripe listen` endpoint.

## Deploy the API

For Railway, use the prepared `backend/Dockerfile` and `backend/railway.json` as described in
[`docs/railway.md`](railway.md). The image caches config/routes/views, runs migrations on boot, and
can seed once with `RUN_SEED=true`.

For a VPS or other PHP host:

1. Create the MySQL database and a dedicated user. Grant only the database privileges Laravel needs.
2. Upload the repository or deploy it with your host's Git integration. Do not upload `.env` files,
   `backend/vendor`, or `server/data`.
3. Run:
   ```bash
   cd backend
   composer install --no-dev --optimize-autoloader
   cp .env.example .env
   # edit .env with the secrets above
   php artisan key:generate
   php artisan migrate --force
   php artisan optimize
   ```
   Do not run `db:seed` in production unless you intentionally want the sample CMS content and sample
   performances. Run the seeders in staging only.
4. Create the initial admin account and deliver a setup link:
   ```bash
   php artisan admin:setup-link
   ```
   With `ADMIN_RESET_DELIVERY=mail` and Brevo configured, the link is emailed. It expires in 60
   minutes and can be used once.
5. Configure the web server:
   - Document root: `backend/public`
   - PHP-FPM with the same PHP version as CI
   - HTTPS redirect
   - Deny direct access to `backend/.env`, `backend/storage`, and `backend/vendor`
   - Forward the client scheme and IP so Laravel can generate HTTPS URLs and rate-limit correctly
6. Check `GET https://api-staging.example.com/api/health`. It must return `{"status":"ok"}` with
   security headers. The framework health route `/up` is also available.
7. Run `php artisan config:cache` after every environment change. Clear it with
   `php artisan config:clear` before debugging a changed value.

## Deploy the frontend

1. Import the repository into Vercel.
2. Add `VITE_API_BASE_URL` and the Stripe publishable key for the environment.
3. Deploy, then add the staging/preview domain to `FRONTEND_URLS` in the Laravel environment and
   redeploy or clear cached config.
4. Verify deep links such as `/about`, `/stories`, and `/admin/login` directly. `vercel.json` must
   rewrite unknown paths to `index.html`.
5. Serve over HTTPS. Stripe live payments will not run on plain HTTP.

## Brevo checklist

- Create an SMTP key in Brevo: **Settings -> SMTP & API -> SMTP**. The SMTP login is not always the
  account email; it often looks like `<id>@smtp-brevo.com`.
- Verify the sender address under **Senders**.
- If the account blocks unknown IPs, authorize the API host's outbound IP under
  **Settings -> Security -> Authorized IPs**, or disable the restriction deliberately.
- Set `MAIL_FROM_ADDRESS` to the verified sender. A mismatch can make Brevo reject the message.
- Use `php artisan admin:setup-link` or the forgot-password screen to verify delivery.
- Do not put SMTP keys in `README.md`, CI logs, or screenshots.

## Stripe checklist

- Staging uses test keys and test cards. Production uses live keys immediately before launch.
- Set `STRIPE_WEBHOOK_SECRET` from the live webhook endpoint; the local `stripe listen` secret is not
  valid in production.
- The donation API requires HTTPS for live keys.
- Make one small live donation, confirm the receipt and ledger entry, then refund it in Stripe as
  part of UAT.
- Keep `server/data` off the public web root. It contains donor details.

## Backups and monitoring

- Take a daily MySQL backup with a transaction-safe dump, encrypt it, store it off the API host, and
  keep at least 14 daily and 4 weekly copies.
- Test a restore into a separate database before launch and after any schema change.
- Back up the donation ledger if the webhook is used. It is append-only JSONL and contains personal
  data.
- Monitor `/api/health`, disk space, PHP error logs, and Brevo/Stripe delivery failures.
- Keep `APP_DEBUG=false`; never expose stack traces or environment values to users.
- Rotate the admin password and SMTP/Stripe keys if a device or secret is lost.

## Rollback

1. Deploy the previous application release.
2. Restore the database only if the failed release changed data in a way that cannot be reversed.
   Schema rollbacks are not a substitute for a tested database backup.
3. Keep the same `APP_KEY` unless you intentionally invalidate all signed links.
4. Re-run `php artisan optimize` after restoring configuration.
5. Recheck `/api/health` and the public home page before announcing recovery.

## Launch blockers

The following must be resolved before a production launch:

- Real domain and SEO replacement (staging uses temporary Railway/Vercel URLs; the final domain
  must replace them before launch).
- Brevo sender and SMTP credentials.
- Stripe live keys and a live webhook secret.
- Replace the seeded sample performance schedule and remaining placeholder copy.
- Final UAT using `docs/uat.md`.
- A tested database backup and restore, plus a backup of the donation-ledger volume.

The three launch Stories are approved and seeded as published, non-sample content. Re-check their
rendering and metadata after deployment; new drafts still require review in the CMS.
