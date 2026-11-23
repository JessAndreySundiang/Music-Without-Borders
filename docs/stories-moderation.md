# Story moderation

This document covers the reader-story workflow: submission, pending moderation, public visibility,
moderation audit trail, email notifications, duplicate prevention, optional external cover image URLs,
seed data, demo steps, and mail configuration.

## State machine & Audit trail

| Status | Who creates it | Public? | Meaning |
| --- | --- | --- | --- |
| `draft` | Admin story editor | No | Content being prepared by the band. |
| `pending` | Reader submission or reopened story | No | Waiting for an administrator. |
| `approved` | Admin approve action | Yes | Published at `published_at`. |
| `rejected` | Admin reject action | No | Declined with a required reason. |

Allowed transitions:

```text
draft   -> approved                 (admin approves)
draft   -> draft                    (content edits keep the status)
pending -> approved                 (admin approves; published_at = now)
pending -> rejected                 (admin rejects; reason required)
rejected -> pending                 (admin reopens; reviewer fields cleared)
approved -> approved                (content edits keep published_at)
any -> soft-deleted                 (admin deletes)
```

Only `status = approved` stories are returned by `GET /api/stories` and `GET /api/stories/{slug}`.
Draft, pending, and rejected stories return `404` on the public detail route. `published_at` is not
an independent visibility switch; it is set when a story is approved and cleared when it is rejected.

### Moderation Audit Trail (`story_moderation_events`)

Every status change and submission creates an immutable record in the `story_moderation_events` table:

| Column | Type | Description |
| --- | --- | --- |
| `story_id` | Foreign ID | References `stories.id` (cascades on delete) |
| `action` | Enum/Varchar | `submitted`, `approved`, `rejected`, `reopened` |
| `actor_id` | Foreign ID Nullable | References `users.id` (null for public submissions) |
| `reason` | Text Nullable | Rejection reason when action is `rejected` |
| `created_at` | Timestamp | Time the event took place |

The full history is exposed to administrators via `AdminStoryResource` in the `events` array and
rendered in the admin story preview dialog. Reopening a rejected story retains all past rejection
reasons and notes in this audit trail.

## Email notifications

Four mailables notify authors and administrators of story lifecycle events:

1. `StorySubmittedConfirmation`: Sent to the author's email upon submission with review expectations.
2. `StorySubmissionAlert`: Sent to `STORY_ADMIN_EMAIL` (default: `Communitymusicband@gmail.com`) alerting the team of a new queue entry.
3. `StoryApprovedNotification`: Sent to the author when approved, with a direct link to the published story.
4. `StoryRejectedNotification`: Sent to the author when rejected, including the polite editorial reason.

### Resilient delivery

All notification emails are dispatched inside `DB::afterCommit(...)` callbacks wrapped in a try/catch block.
If the SMTP/mail transport throws an exception or network drops:
- The database transaction is **not** aborted or rolled back.
- The story's status transition succeeds.
- A warning is recorded in the application log **without** logging author email addresses or story bodies.

## Duplicate submission prevention

`POST /api/stories/submissions` enforces duplicate prevention:
- If a submission is received with the same normalized `author_email` and trimmed `title` within the last 24 hours, the request is rejected with `HTTP 422` ("A story with this title was already submitted from this email address recently. Please wait for our team to review it.").

## Optional cover image URL

- Submissions accept an optional `cover_image_url` (up to 2048 characters).
- Validated to enforce the `https://` protocol and a valid domain host.
- The submission form includes a live image preview and error fallback.
- The admin preview dialog and queue card render the external cover image.
- Public story lists and detail pages display `cover_image_url` when present (with fallback to `cover_image_path`).
- Image upload and storage handling are deferred to maintain security and lightweight operations.

## Reference tracking codes & status lookup

- Every story receives an immutable, unique reference code generated on creation (`MWB-` prefix followed by 8 uppercase alphanumeric characters, e.g. `MWB-ABCD1234`).
- Authors receive their reference code immediately on the submission confirmation screen and in their email confirmation.
- Authors can track their submission anytime using the **Track your submission** lookup panel on `/stories/submit` or via `GET /api/stories/status/{reference_code}`.
- **Strict Privacy Guarantee**: The status endpoint returns strictly non-sensitive tracking information (`reference_code`, `title`, `status`, `category`, `submitted_at`, `published_at`, and polite `rejection_reason` only if rejected). It **never** returns `author_email`, story body text, reviewer identity (`reviewed_by`), or moderation audit trail events.
- Rate-limited to 30 requests per minute per IP to prevent code-probing attacks.

## Fixed story categories

- Stories are classified into four curated categories:
  1. `community`: Community Outreach (default)
  2. `concert`: Concert
  3. `rehearsal`: Rehearsal
  4. `lending-library`: Lending Library
- Stored in the indexed `stories.category` column.
- Both the public submission form and the admin story editor provide dropdown selectors for these categories.
- The public API `GET /api/stories?category={slug}` supports filtering by category.
- The public `/stories` directory features category filter tabs with real-time story counts and instant client-side switching.
- Category badges appear on story cards and detail headers.

## Privacy boundary

`StoryResource` is the public representation. `AdminStoryResource` is the only story output that
may contain:

- `author_email`
- `status`
- `consent_at`
- `reviewed_by` and the reviewer name
- `reviewed_at`
- `rejection_reason`
- `events` (moderation audit trail)

The public resource never includes those fields. The public submission endpoint also never returns
the stored record; it returns a short generic message. Do not log submitted email addresses or story
bodies.

## Editorial moderation checklist

Administrators reviewing pending submissions should verify:

1. **Relevance**: Does the story describe a real or community-focused music experience?
2. **Respect & Safety**: Is the story free from hate speech, harassment, profanity, or defamatory remarks?
3. **Consent**: Did the author confirm their permission to publish?
4. **Privacy**: Ensure no phone numbers, physical home addresses, or private third-party personal details appear in the story text.
5. **Quality**: Is the text legible plain text without commercial advertising or spam links?

## API endpoints

### Public endpoints

#### Public story listing & detail

- `GET /api/stories`: Returns approved stories. Accepts optional `?category={slug}` filter query parameter. Returns metadata with category breakdown.
- `GET /api/stories/{slug}`: Returns an approved story by slug. Draft, pending, and rejected stories return `404`.

#### Public status tracking

`GET /api/stories/status/{reference_code}`, rate-limited to 30 requests per minute per IP.

Returns non-sensitive tracking status for a submission code (`MWB-XXXXXXXX`):

```json
{
  "data": {
    "reference_code": "MWB-ABCD1234",
    "title": "A Saturday at the Plaza",
    "status": "pending",
    "category": "community",
    "submitted_at": "2026-11-23T12:00:00+08:00",
    "published_at": null,
    "rejection_reason": null
  }
}
```

If rejected, `rejection_reason` contains the polite editorial reason. If the reference code does not exist, returns `404`.

#### Public submission

`POST /api/stories/submissions`, rate-limited to 3 requests per 60 minutes per IP.

| Field | Rule |
| --- | --- |
| `title` | Required, 5–120 characters |
| `category` | Optional, one of `community`, `concert`, `rehearsal`, `lending-library`; defaults to `community` |
| `author_name` | Required, 2–80 characters |
| `author_email` | Required, valid email, up to 255 characters, stored lowercase |
| `author_role` | Optional, 2–100 characters |
| `cover_image_url` | Optional, valid `https://` URL, up to 2048 characters |
| `body` | Required, 200–10,000 characters, plain text |
| `excerpt` | Optional, up to 500 characters; derived from the body when omitted |
| `consent` | Required and accepted |
| `website` | Honeypot; must be empty |

A valid request returns `201` with a generic pending-review message and the assigned `reference_code`. Missing consent, an invalid
email, a short body, or a filled honeypot returns `422`. The fourth request from one IP within an
hour returns `429`. Duplicate submissions from the same email and title within 24 hours return `422`.

### Admin moderation

All routes require a Sanctum bearer token for a user with `is_admin = true`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/stories?status=pending` | List stories and counts by status |
| `POST` | `/api/admin/stories/{story}/approve` | Approve a draft or pending story |
| `POST` | `/api/admin/stories/{story}/reject` | Reject a pending story with `rejection_reason` |
| `POST` | `/api/admin/stories/{story}/reopen` | Return a rejected story to `pending` |
| `POST` | `/api/admin/stories/{story}/feature` | Feature an approved story (unfeatures any other) |
| `POST` | `/api/admin/stories/{story}/unfeature` | Unfeature a story |

`GET /api/admin/stories` accepts `draft`, `pending`, `approved`, or `rejected` as the optional
`status` filter and returns `meta.counts` for every status plus `all`. The generic story
create/update routes cannot change status or moderation fields.

## Admin workflow

1. Open `/admin` and choose **Stories**.
2. The **Pending** filter is selected by default and shows the review queue count.
3. Select **Preview** to read the full story, author, private email, consent time, and any previous
   rejection reason.
4. Select **Approve**, then confirm. The story becomes public immediately and leaves the pending
   queue.
5. Select **Reject**, choose a reason, and optionally add a note. Rejection is private; the story
   remains hidden from the public site.
6. Use **Reopen** on a rejected story to return it to the pending queue.
7. The existing story editor keeps working for admin-authored stories. New stories start as drafts
   and are published through **Approve**, not through the content form.

The queue and the editor read the same `stories` table and the same `status` field. There is no
second visibility flag.

## Featured stories

- An approved story can be designated as the **Featured Story** by an administrator in the CMS.
- **Single-featured invariant**: At most one story can be featured at any time across the entire site. Featuring a story automatically unfeatures any previously featured story within an atomic database transaction.
- Only stories with `status = approved` can be featured. Attempting to feature a `draft`, `pending`, or `rejected` story returns `HTTP 422`.
- When an approved story is featured, it renders in the prominent **Featured story** spotlight banner at the top of `/stories` with an image, excerpt, and call to action, while the remaining stories render below in the card grid.
- Detail pages (`/stories/:slug`), story cards, and queue previews display an eye-catching "Featured story" badge.
- Unfeaturing a story returns it to the regular card grid.
- The public stories count on `/stories` always accurately represents approved stories only (`data.length`).

## Seed data

`StorySeeder` creates the three approved launch stories with `is_sample = false`.

`StorySubmissionSeeder` creates demo data for the queue:

- two `pending` reader submissions;
- one `rejected` submission with a sample rejection reason;
- all three marked `is_sample = true` and kept private.

The samples are safe to delete after a demo. They contain example email addresses on
`example.com`.

## Demo from a clean local database

Only run this against a local development database. It destroys the local database contents.

```bash
cd backend
php artisan migrate:fresh --seed
php artisan admin:setup-link
php artisan serve
```

Then:

1. Start the frontend with `npm run dev` from the repository root.
2. Open `http://localhost:5173/stories` and select **Share your story**.
3. Submit a story with a body of at least 200 characters and check the consent box.
4. Sign in at `/admin` using the one-time setup link written to
   `backend/storage/app/private/admin-reset-link.txt` and set a password.
5. Open **Stories**. The new submission and the two seeded pending samples appear under
   **Pending**.
6. Preview, approve one story, and confirm that it appears at `/stories` and at its detail URL.
7. Reject another with a reason and confirm that its detail URL still returns the not-found state.

To remove the demo submissions without touching the three launch stories, delete them from the
admin queue or reset the database with `migrate:fresh --seed`.

## Local mail configuration

Automated notification emails are sent for new story submissions, author confirmations, approvals, and rejections.

- Local default: configure `MAIL_MAILER=log` in `backend/.env` for local development. Outgoing emails are written to `backend/storage/logs/laravel.log`.
- Admin notification recipient: set `STORY_ADMIN_EMAIL` in `backend/.env` (defaults to `ADMIN_EMAIL` / `Communitymusicband@gmail.com`).
- Admin password resets: `ADMIN_RESET_DELIVERY=file` writes a single-use link to
  `backend/storage/app/private/admin-reset-link.txt`. The link expires after 60 minutes.
- Staging/production: set `ADMIN_RESET_DELIVERY=mail`, configure `MAIL_MAILER=brevo` and
  `BREVO_API_KEY`, and keep `FRONTEND_URL` pointed at the deployed site so links resolve.
- Mail delivery is fail-safe: failures never block status changes and never log author emails or story bodies.

## Verification

Backend:

```bash
cd backend
php artisan test --filter='StoriesApiTest|StorySubmissionApiTest|StoryModerationApiTest'
php artisan test
vendor/bin/pint --test
```

Frontend unit tests and checks:

```bash
npm test
npm run lint
npm run build
npm run format:check
```

Browser flows (Chromium must be installed once with `npx playwright install chromium`):

```bash
npm run test:e2e
```

The E2E moderation spec creates its own admin account at runtime with a random password, using the
database configured for the Playwright backend. It does not commit a password. The suite expects the
configured database to have the standard migrations and seed data, exactly like the existing
Playwright tests.

For an isolated local run, point Laravel at a throwaway SQLite file before starting Playwright:

```powershell
# PowerShell, from the repository root
$env:DB_CONNECTION = "sqlite"
$env:DB_DATABASE = "$PWD/backend/database/e2e.sqlite"
$env:APP_ENV = "testing"
cd backend
php artisan migrate:fresh --seed --force
cd ..
npm run test:e2e
```

The SQLite file is ignored by git. CI uses a migrated, seeded MySQL database instead.
