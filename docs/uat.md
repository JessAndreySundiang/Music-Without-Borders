# User Acceptance Test Checklist

Run this against the staging deployment before launch. Record the browser, date, tester, and result
for each section. The automated browser suite covers Chromium desktop, mobile navigation, the theme
toggle, redirects, the admin sign-in guard, and WCAG A/AA checks; complete the rest by hand.

Current staging URLs (temporary):

- SPA: <https://music-without-borders.vercel.app>
- API health: <https://api-production-ecd40767.up.railway.app/api/health>
- Donation API health: <https://donations-production-c25b1981.up.railway.app/health>

The suite can target staging without starting local servers:

```bash
$env:E2E_BASE_URL = "https://music-without-borders.vercel.app"
$env:E2E_API_URL = "https://api-production-ecd40767.up.railway.app"
npm run test:e2e
```

## Public site

- [ ] Home loads with **Music Without Borders** in the header and footer, and CMS copy is visible.
- [ ] Navigation works for Home, Performances, Instruments, About, Stories, and Donate.
- [ ] `/schedule` loads the performances page.
- [ ] `/blog` redirects to `/stories`.
- [ ] Deep links to `/about`, `/stories`, and `/admin/login` work after a hard refresh.
- [ ] Unknown URLs show the 404 page with working links.
- [ ] Light and dark themes are readable, and the choice survives a refresh.
- [ ] Mobile menu opens, closes with Escape, navigates, and does not overflow horizontally.
- [ ] Keyboard-only navigation reaches the skip link, menu, theme toggle, forms, and footer links.
- [ ] Focus outlines are visible in both themes.
- [ ] `prefers-reduced-motion` does not leave content hidden.

## Performances and instruments

- [ ] The performances list shows all seeded/curated events.
- [ ] Search filters by title, venue, city, and conductor.
- [ ] Event-type filters and **Clear Filters** work.
- [ ] Performance detail pages open and show the correct date, venue, and description.
- [ ] The instruments page shows the intended gallery and all instrument photographs.
- [ ] Family jump links scroll to the correct sections.

## Stories

- [ ] The three approved launch Stories appear on `/stories` with title, excerpt (or placeholder
      artwork), author, and date; no "Sample story" badges are visible.
- [ ] Story detail opens at `/stories/<slug>` and renders the full body.
- [ ] Unpublishing a Story removes it from the public list.
- [ ] A missing Story slug shows a safe not-found state, not a stack trace.
- [ ] If all Stories are unpublished, the empty state appears instead of an error.

## Admin workspace

- [ ] `/admin` redirects to `/admin/login` when signed out.
- [ ] A wrong password shows a generic error, not a different message for known and unknown emails.
- [ ] A valid admin can sign in; the token is stored and `/admin/me` succeeds.
- [ ] Admin can edit and reorder Home and About sections, hide/show items, and save settings.
- [ ] Admin can create, edit, publish, unpublish, reorder, and soft-delete performances.
- [ ] Admin can create, edit, publish, unpublish, and soft-delete testimonials.
- [ ] Admin can create, edit, publish, unpublish, and soft-delete Stories.
- [ ] Signing out invalidates the token; the dashboard is protected again.
- [ ] An expired or revoked token sends the user back to sign-in without exposing data.

## Password reset

- [ ] **Forgot password** always returns the same message for known and unknown addresses.
- [ ] With `ADMIN_RESET_DELIVERY=mail`, the Brevo email arrives with a working link.
- [ ] The link opens `/admin/reset-password` and accepts a password of at least 10 characters.
- [ ] The link works once, then fails with a clear message.
- [ ] A link older than 60 minutes fails.
- [ ] The new password signs in, and the old password does not.
- [ ] No reset token appears in logs, API responses, or the browser console.
- [ ] On a local file-delivery install, the link is only in
      `backend/storage/app/private/admin-reset-link.txt`.

## Donations

- [ ] Staging uses `pk_test_` / `sk_test_`; production uses live keys immediately before launch.
- [ ] A test donation succeeds and the receipt shows the correct amount and donor details.
- [ ] The donation appears in the ledger.
- [ ] The donation alert email reaches the configured inbox.
- [ ] The Stripe webhook signature is accepted and duplicate delivery is idempotent.
- [ ] Invalid amounts and expired/declined cards show a useful message.
- [ ] The live smoke donation succeeds and is refunded in Stripe.
- [ ] The donation API is not exposed without HTTPS in production.

## SEO and content

- [ ] The final domain replaces the temporary Vercel URL in `index.html`, `public/robots.txt`, and
      `public/sitemap.xml`.
- [ ] Canonical, Open Graph, Twitter, and JSON-LD URLs use the production domain.
- [ ] `og-image.jpg` and the favicon load over HTTPS.
- [ ] Page titles describe the page and the brand.
- [ ] No sample banners or placeholder copy remain on public pages.
- [ ] Privacy, Terms, and Accessibility pages are reviewed for the operating organization.
- [ ] Social links point at the real profiles.

## Security and operations

- [ ] `APP_DEBUG=false` and `APP_ENV=production` in production.
- [ ] HTTPS redirect and HSTS are active.
- [ ] Security headers are present on the SPA and API.
- [ ] CORS contains only the production SPA origin.
- [ ] `/api/health` is green; `/up` is green.
- [ ] MySQL is not reachable from the public internet.
- [ ] `.env`, `backend/storage`, and `backend/vendor` are not web-accessible.
- [ ] Brevo and Stripe secrets are stored in the host's secret manager, not the repo.
- [ ] The Railway donation volume is mounted at `/app/data` and survives a redeploy.
- [ ] Daily MySQL backups exist and a restore has been tested.
- [ ] Uptime/error monitoring is configured.
- [ ] The release can be rolled back to the previous commit and database backup.

## Sign-off

| Area | Tester | Date | Result / notes |
| --- | --- | --- | --- |
| Public site |  |  |  |
| Admin |  |  |  |
| Stories |  |  |  |
| Donations |  |  |  |
| Accessibility |  |  |  |
| Security/operations |  |  |  |
