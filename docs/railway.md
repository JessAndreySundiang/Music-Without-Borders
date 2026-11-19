# Railway + Vercel Staging Deployment

This runbook deploys the staging/UAT stack without a custom domain:

| Piece | Host | Root directory |
| --- | --- | --- |
| React SPA | Vercel | repository root |
| Laravel API | Railway | `backend/` |
| MySQL | Railway MySQL service | managed by Railway |
| Stripe donation API | Railway | `server/` |

## Current staging deployment

These temporary URLs are live for UAT. Replace them with the final domain before launch.

| Service | URL |
| --- | --- |
| SPA | <https://music-without-borders.vercel.app> |
| Laravel API | <https://api-production-ecd40767.up.railway.app/api> |
| Laravel health | <https://api-production-ecd40767.up.railway.app/api/health> |
| Donation API | <https://donations-production-c25b1981.up.railway.app> |
| Donation health | <https://donations-production-c25b1981.up.railway.app/health> |

The Laravel image runs migrations on boot. The donation API stores donor records and pending
alerts under `/app/data`, so that path **must** be mounted as a Railway volume. The donation image's
entrypoint gives the unprivileged `node` user ownership of that mount before starting the server.

Do not paste secrets into chat, issues, commits, or screenshots. Enter them in the Railway or
Vercel dashboards, or through their CLIs.

## 1. Create the Railway project and MySQL

1. Create a Railway project.
2. Add a **MySQL** service.
3. Open the MySQL service variables and note `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`,
   `MYSQLUSER`, and `MYSQLPASSWORD`. The Laravel service will reference them directly.

## 2. Deploy the Laravel API

Create a service from `JessAndreySundiang/Music-Without-Borders` and set its **root directory** to
`backend`. Railway will use `backend/Dockerfile` and `backend/railway.json`.

Set these service variables. Use Railway's reference picker for the `${{MySQL.*}}` values; do not
copy the database password into a shell command.

```dotenv
APP_NAME=Music Without Borders
APP_ENV=staging
APP_KEY=base64:generate-with-php-artisan-key-generate-show
APP_DEBUG=false
APP_URL=https://GENERATED-LARAVEL-DOMAIN
APP_TIMEZONE=Asia/Manila
FORCE_HTTPS=true
TRUSTED_PROXIES=*
FRONTEND_URL=https://GENERATED-VERCEL-DOMAIN
FRONTEND_URLS=https://GENERATED-VERCEL-DOMAIN
SANCTUM_EXPIRATION=480
ADMIN_EMAIL=Communitymusicband@gmail.com
ADMIN_NAME=Music Without Borders Admin
# Keep "file" only for local development. Production uses the Brevo API, so set
# this to "mail" after BREVO_API_KEY is saved and verified, then redeploy.
ADMIN_RESET_DELIVERY=mail
CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
LOG_CHANNEL=stderr
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

# Railway blocks outbound SMTP on every port, so Laravel uses Brevo's HTTPS API.
# Create an API v3 key under Settings -> SMTP & API -> API Keys. This is NOT the
# SMTP key, and it must be a verified sender address.
MAIL_MAILER=brevo
BREVO_API_KEY=<Brevo API v3 key>
MAIL_FROM_ADDRESS=<verified Brevo sender>
MAIL_FROM_NAME=Music Without Borders

# First boot only. Remove it after the seeders finish; re-running them would
# overwrite CMS edits.
RUN_SEED=true
```

The `drop_unused_default_tables` migration removes Laravel's database cache, session, queue, and
password-reset tables. Keep `CACHE_STORE=file`, `SESSION_DRIVER=file`, and `QUEUE_CONNECTION=sync`;
without them, rate-limited auth routes return 500 because Laravel falls back to a missing `cache`
table.

Generate `APP_KEY` locally from `backend/`:

```bash
php artisan key:generate --show
```

Copy the single output line into the Railway variable. Keep it stable; changing it invalidates
signed reset links.

Deploy from the repository root. The path argument and `--path-as-root` keep Railpack from treating
the repository root (the Vite app) as the build context:

```bash
railway up backend --service api --path-as-root
```

Running `railway up` from the repository root without `backend --path-as-root`, or from inside
`backend/` without `--path-as-root`, can replace the API with the Vite site. The API then serves
`index.html` and `/api/health` returns a 502 or HTML instead of JSON.

Then generate a public domain under **Settings -> Networking**. Put that HTTPS URL in `APP_URL`.
The health check is `GET <api-domain>/api/health`; it must return `{"status":"ok"}`.
The container caches config/routes/views, runs migrations, optionally seeds, then starts Apache on
Railway's injected `PORT`.

After the first successful boot, remove `RUN_SEED`. Confirm the data survived the restart:

```sql
SELECT COUNT(*) FROM stories;
SELECT COUNT(*) FROM site_settings;
```

The three approved launch Stories are seeded published and non-sample. Do not run the seeders again
after editing them in the CMS.

## 3. Deploy the Stripe donation API

Create a second Railway service from the same repository with root directory `server`. Railway will
use `server/Dockerfile` and `server/railway.json`.

Add a volume mounted at `/app/data`. Without it, the donation ledger and pending-alert queue are
lost on every deploy.

Set these variables:

```dotenv
NODE_ENV=production
TRUST_PROXY=1
CORS_ORIGINS=https://GENERATED-VERCEL-DOMAIN
DONATION_NOTIFY_TO=Communitymusicband@gmail.com
DONATIONS_FILE=/app/data/donations.jsonl
PENDING_ALERTS_FILE=/app/data/pending-alerts.jsonl

# Staging: test keys. Replace with live keys immediately before launch.
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Brevo alert delivery over HTTPS. Same API v3 key and verified sender as the
# Laravel API. Do not use SMTP_FALLBACK_* on Railway: outbound SMTP is blocked.
BREVO_API_KEY=<Brevo API v3 key>
BREVO_FROM=<verified Brevo sender>
```

Deploy from `server/`. Use `--path-as-root` for the same reason; without it the CLI can fail with
`prefix not found` before a deployment is created:

```bash
cd server
railway up . --path-as-root --service donations
```

Generate a public domain for this service too. Its health check is `GET <donation-domain>/health`.

Create the Stripe webhook endpoint at:

```text
https://GENERATED-DONATION-DOMAIN/stripe-webhook
```

Listen for `payment_intent.succeeded`, then copy the endpoint's signing secret into
`STRIPE_WEBHOOK_SECRET` and redeploy. The local `stripe listen` signing secret is not valid for
the deployed endpoint.

## 4. Deploy the frontend to Vercel

Import the repository into Vercel. Keep the project root at the repository root; the Vite build and
`vercel.json` are already configured.

Set these environment variables for the Preview/Production environment:

```dotenv
VITE_API_BASE_URL=https://GENERATED-LARAVEL-DOMAIN/api
VITE_API_URL=https://GENERATED-DONATION-DOMAIN
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

`VITE_API_BASE_URL` must include `/api`. `VITE_API_URL` is the donation API root, without a trailing
slash. The Stripe publishable key is public by design; never put `sk_...` in Vercel.

Deploy with the Vercel CLI (`npx vercel --prod`) or connect the repository under
**Project -> Settings -> Git**. The CLI is useful when the Git integration is not attached:

```bash
npx vercel --prod --yes
```

`npx vercel git connect` fails with *Failed to connect ... make sure there aren't any typos*
until the Vercel GitHub App is installed for the repository owner. Connect it once in the
dashboard (**Project -> Settings -> Git -> Connect Git Repository**, which opens the GitHub App
install flow), then pushes to `main` deploy automatically. Until then, every merge needs a manual
`npx vercel@latest --prod --yes` from the repository root.

Open the generated `*.vercel.app` URL, then go back to Railway:

- Set `FRONTEND_URL` and `FRONTEND_URLS` on the Laravel service to the Vercel URL.
- Set `CORS_ORIGINS` on the donation service to the Vercel URL.
- Save the variables and confirm the services restart/redeploy.

Verify deep links by opening `/about`, `/stories`, `/stories/<slug>`, `/admin/login`, and a missing
URL directly. `vercel.json` supplies the SPA fallback.

## 5. Brevo and the first admin

Railway blocks outbound SMTP on every port (including 587 and 465), so production
mail uses Brevo's **HTTPS API**, not SMTP. A connection timeout from the Railway
container is the network policy, not a bad SMTP password.

1. In Brevo, verify the sender address under **Senders**.
2. Create an **API v3 key** under **Settings -> SMTP & API -> API Keys**. This is
   not the SMTP key. Add it to both Railway services as `BREVO_API_KEY`; never
   commit it or paste it into chat.
3. Under **Account -> Security -> Authorized IPs**, turn off **Block unknown IP
   addresses** for API keys, or allowlist Railway's outbound IPs. If the block is
   on and the egress IP is missing, Brevo returns
   `401 ... unrecognised IP address` even though the API key is correct.

   Each Railway service has its **own** outbound IP, and the address changes on
   redeploy. On 2026-11-18 the `api` service egressed from `162.220.234.81` while
   `donations` egressed from `152.55.180.213`. After the 2026-11-19 redeploy the
   API egressed from `152.55.182.35`, and Brevo still returned 401 until the
   unknown-IP block was disabled. Check the current address from the service
   shell:

   ```bash
   curl -s https://api.ipify.org
   ```

   Allowlisting individual addresses is brittle. Prefer disabling the API-keys
   IP block, or enable Railway **Static Outbound IPs** on both services and
   allowlist the three fixed addresses.

   The Laravel entrypoint runs `php artisan mail:verify` before Apache starts
   and stops the container on a Brevo 401. This is a pre-flight check, not a
   zero-downtime rollback: in the current CLI deploy setup Railway removes the
   previous deployment when the new one is created, so a failed check can leave
   the API unavailable. If that happens, restore service immediately with the
   log transport, then fix Brevo:

   ```bash
   railway variables --service api --set MAIL_MAILER=log --skip-deploys
   railway up backend --service api --path-as-root
   ```

   Public pages stay up, but password-reset and alert email are not delivered.
   Restore `MAIL_MAILER=brevo` and redeploy only after Brevo accepts the current
   egress IP. The donations service still queues alerts in
   `/app/data/pending-alerts.jsonl` and retries, so a mail outage delays alerts
   instead of losing them.
4. Set `MAIL_FROM_ADDRESS` (Laravel) and `BREVO_FROM` (donation API) to the
   verified sender.
5. Set `ADMIN_RESET_DELIVERY=mail` only after `BREVO_API_KEY` is saved, then
   redeploy the Laravel API. While it is `file`, the one-time link stays inside
   the container and must not be copied into chat, logs, or a screenshot.
6. Run the setup command in the Laravel service shell, or use the Railway CLI:

   ```bash
   railway ssh -- php artisan admin:setup-link
   ```

   With `ADMIN_RESET_DELIVERY=mail`, the one-time link is emailed to
   `Communitymusicband@gmail.com`. It expires in 60 minutes. Never print the link
   or the admin password into chat.
7. Open the link, choose a password of at least 10 characters, and sign in at
   `/admin/login` (also linked from the public footer as **Staff login**).

To check the donation service's transport locally:

```bash
cd server
npm run check-mail
npm run check-mail -- --send
```

`Brevo API` should appear first when `BREVO_API_KEY` is set. On Railway, the
`/health` payload reports `mail: true` when an alert transport is configured; it
does not prove the key is valid. Verify with a real test donation.


## 6. Verify before UAT

- `GET <api>/api/health` is green and returns security headers.
- `GET <api>/api/stories` returns the three launch Stories with `is_sample: false`.
- `GET <donation>/health` is green.
- A Stripe test donation succeeds with card `4242 4242 4242 4242`, any future date, any CVC.
- The test donation appears in the Railway volume at `/app/data/donations.jsonl`.
- The donation alert email arrives via Brevo's HTTPS API (or is queued in
  `/app/data/pending-alerts.jsonl`).
- `npm run check-mail` in `server/` lists `Brevo API` first and verifies the key.
- A forgotten-password request sends a Brevo API email; the link works once and expires after 60
  minutes.
- Run the MySQL and donation-ledger restore rehearsal in [`docs/backups.md`](backups.md).
- Complete [`docs/uat.md`](uat.md).

## 7. Before launch

1. Attach the real domain in Vercel and update `APP_URL`, `FRONTEND_URL`, `FRONTEND_URLS`, and
   `CORS_ORIGINS`.
2. Replace the temporary Vercel URL in `index.html`, `public/robots.txt`, and `public/sitemap.xml`
   with the final domain.
3. Switch Stripe to live keys and create a live webhook endpoint. Keep the test webhook for
   staging.
4. Make one small live donation, verify the receipt and ledger, then refund it in Stripe.
5. Set `APP_ENV=production` and keep `APP_DEBUG=false`.
6. Enable Railway **Daily**, **Weekly**, and **Monthly** volume backups for MySQL and donations,
   then re-run the restore rehearsal in [`docs/backups.md`](backups.md).
7. Re-run the UAT checklist against the final domain.
