# CMS improvement plan: reader story submissions and moderation

Status: revised proposal, not started  
Context: school project using the existing custom CMS  
Scope: public story submissions and the admin accept/reject workflow, plus the quality work needed to make that workflow safe and demonstrable  
Verified against: `9663e6a` on 2026-11-22

## 1. Why this revision

The previous version of this plan was written as a production launch plan. It prioritized backups,
uptime monitoring, static generation, CDN caching, and other operational work that is disproportionate
for a school project.

The actual goal is narrower and more useful to demonstrate:

> A visitor can submit a story from the Stories section. The admin can review it, accept it, or
> reject it with a reason. Accepted stories appear publicly; pending and rejected stories do not.

This revision replaces the launch-oriented roadmap with a right-sized feature plan. It keeps the
engineering basics that matter for a school project: a clear data model, authentication, validation,
a state machine, tests, accessibility, and a clean demo.

## 2. Definition of done

The core feature is complete when all of the following are true:

- A visitor can open **Stories → Share your story** and submit a story without creating an account.
- The submission is saved as **pending** and is not visible on the public Stories page.
- The admin sees the pending submission in a moderation queue.
- The admin can read the full submission and **approve** or **reject** it.
- Rejection requires a reason. The reason is stored and can be emailed to the author.
- An approved story appears in the public Stories list and detail page.
- A rejected story never appears publicly.
- The author's email address is never exposed by the public API.
- The workflow is covered by API tests, a browser test, and an accessibility check.
- The project includes seeded demo submissions so the queue is not empty during a presentation.

## 3. Current state

| Area | What exists today | Gap for this feature |
| --- | --- | --- |
| Public Stories | `src/pages/Stories.tsx` lists published stories; `StoryDetail.tsx` shows one story | No submission call to action or form |
| Public API | `GET /api/stories` and `GET /api/stories/{slug}` in `StoryController` | Only reads stories; no public submission endpoint |
| Story model | `Story` has title, slug, excerpt, body, author name/role, cover path, `is_published`, `is_sample`, `published_at` | No pending/rejected status, author email, consent, reviewer, or rejection reason |
| Admin Stories | `AdminStoryController` provides CRUD; `StoriesAdmin` uses the generic `RecordManager` | No moderation queue, no approve/reject actions, no reason capture, no status filter |
| Visibility | `Story::scopePublished()` filters on `is_published` | Needs a single status source of truth; currently no concept of pending or rejected |
| Admin API | `GET/POST/PUT/DELETE /api/admin/stories` behind Sanctum and admin middleware | Needs moderation actions and an admin-only resource that includes private fields |
| Tests | `StoriesApiTest` covers public visibility and admin CRUD | Does not cover submission, moderation, rejection, privacy, or the full flow |
| Email | Mail transport is configured for the deployed API | No story submission or decision notifications |

The existing pieces are reusable. The main change is adding a moderation state to the story lifecycle
and a dedicated admin queue, not rebuilding the Stories feature.

## 4. Target workflow and state machine

### Roles

- **Visitor:** reads approved stories and submits a story.
- **Author:** the visitor who submitted a story; identified by a private email address.
- **Admin:** the existing authenticated CMS user; reviews submissions and manages stories.

### States

| State | Meaning | Publicly visible? | Who can set it |
| --- | --- | --- | --- |
| `draft` | Admin-created story that is not ready | No | Admin |
| `pending` | Reader submission awaiting review | No | System on submission; admin on reopen |
| `approved` | Accepted and published | Yes | Admin |
| `rejected` | Reviewed and declined | No | Admin, with a reason |

### Allowed transitions

| From | To | Action | Side effects |
| --- | --- | --- | --- |
| `draft` | `approved` | Admin publishes | Set `published_at`, reviewer fields |
| `pending` | `approved` | Admin approves | Set `published_at`, reviewer fields, clear rejection reason |
| `pending` | `rejected` | Admin rejects | Require a reason, set reviewer fields |
| `rejected` | `pending` | Admin reopens | Clear reviewer decision, keep the reason in history |
| `approved` | `draft` | Admin unpublishes | Clear or keep `published_at` according to display preference |
| `pending` | `draft` | Admin moves to draft | Optional; useful if the admin wants to edit before deciding |

Do not allow a public submitter to set or change status. Do not allow an approved story to move back
to `pending`; use `draft` or `rejected` for a takedown.

### Public visibility rule

> A story is public only when `status = approved`.

`published_at` is the display date, not the visibility switch. This avoids the current ambiguity
between `is_published` and `published_at` and leaves room for scheduled publishing later if it is ever
needed.

## 5. Scope, assumptions, and open questions

### In scope

- Public story submission form and API.
- Pending, approved, and rejected states.
- Admin moderation queue with approve and reject actions.
- Rejection reason and reviewer metadata.
- Author email kept private.
- Email notifications if mail is available.
- Seed data, tests, accessibility, and a demo script.

### Assumptions

1. This is a school project, not a public launch. The goal is a complete, understandable workflow, not
   production-scale operations.
2. One admin account is enough. Multi-role review and reviewer assignment are not needed.
3. Stories are plain text with paragraph breaks. A rich-text editor is not required and adds XSS risk.
4. A cover image is optional. The core feature is text submission; image upload is deferred.
5. Email notifications are a bonus. The workflow must still work when mail is logged locally or fails.
6. The existing Vercel/Railway deployment can be reused for the demo. A local demo with
   `npm run dev` and Laravel is also acceptable.
7. The existing admin authentication and `admin` middleware remain the authorization boundary.

### Open questions

| Question | Default if unanswered |
| --- | --- |
| Must the author receive an email on approval or rejection? | Implement email in P1; the core workflow does not depend on it |
| Is a cover image required for a story? | No; accept an optional image URL in P1, defer upload |
| Will the demo be shown locally or from the deployed URL? | Support both; document the local path first |
| Should rejected authors be allowed to resubmit? | Not in P0; add `needs_revision` only if time allows |

## 6. Roadmap at a glance

| Phase | Goal | Items | Effort |
| --- | --- | --- | --- |
| P0 | Working submission-to-moderation flow | 6 | 6–8 focused days |
| P1 | Quality, notifications, and presentation polish | 8 | 4–6 focused days |
| P2 | Optional extensions only if time allows | 5 | Conditional |

A focused day means roughly 4–6 hours of work, not a full commercial workday.

## 7. P0 — core workflow

### P0-1. Story status model and migration

**Problem.** The current model has only `is_published`. There is no way to represent a reader
submission that is waiting for review or one that was rejected. Adding a second boolean would create
two sources of truth.

**Proposed change.**

- Add a `status` column with the values `draft`, `pending`, `approved`, and `rejected`.
- Backfill existing rows: `is_published = true` becomes `approved`; `false` becomes `draft`.
- Add `author_email` (private, nullable for admin-created stories), `consent_at`, `reviewed_by`,
  `reviewed_at`, and `rejection_reason`.
- Add an index on `status` and `published_at`.
- Replace the `published()` scope with an approved-only scope. Update `StoryController`,
  `AdminStoryController`, and `StoryResource` to use it.
- Remove `is_published` after the code is updated, or keep it temporarily as a read-only accessor.
  Do not leave two independent fields that can disagree.
- Create separate `StoryResource` (public) and `AdminStoryResource` (private) outputs. The admin
  resource may include email, status, and rejection reason; the public resource must not.

**Rationale.** WordPress uses post statuses such as draft, pending, and publish. Strapi and other
headless CMS platforms distinguish draft from published content. A single status field is the
smallest model that supports the requested workflow.

**Estimated effort.** 1 focused day.

**Risk.** Backfilling incorrectly hides existing stories, or the admin CRUD breaks when
`is_published` is removed. Mitigation: backfill in the migration, run the existing story tests, and
keep the old field for one deployment if needed.

**Acceptance criteria.**

- Existing published stories remain public after migration.
- Existing drafts remain private.
- The public API returns only `approved` stories.
- Pending and rejected stories return 404 on the public detail route.
- The admin response includes status, author email, reviewer, and rejection reason.
- The public response never includes author email or reviewer fields.
- The migration is repeatable in the MySQL smoke job.

### P0-2. Public submission API

**Problem.** There is no way for a visitor to send a story to the CMS.

**Proposed change.** Add `POST /api/stories/submissions` with these rules:

| Field | Rule |
| --- | --- |
| `title` | Required, 5–120 characters |
| `author_name` | Required, 2–80 characters |
| `author_email` | Required, valid email, maximum 255 characters, private |
| `author_role` | Optional, 2–100 characters, for example “student” or “audience member” |
| `body` | Required, 200–10,000 characters, plain text |
| `excerpt` | Optional; derive the first 180 characters from the body if omitted |
| `consent` | Required and accepted; confirms the author allows publication |
| `website` | Honeypot field; must be empty |

- Generate the slug from the title and keep it unique.
- Set `status = pending`, `published_at = null`, and `is_sample = false`.
- Return `201` with a short generic message. Do not return the full record.
- Apply a rate limit such as `throttle:3,60` per IP.
- Use a Form Request or a dedicated submission service so the public payload cannot mass-assign
  `status`, `reviewed_by`, or `published_at`.
- Normalize the email to lowercase for duplicate checks. Never log the email or body.
- Add a duplicate check in P1, not P0.

**Rationale.** A public write endpoint needs explicit validation and abuse controls. The honeypot and
rate limit are standard low-cost protections; manual moderation remains the final gate.

**Estimated effort.** 1–1.5 focused days.

**Risk.** Spam or accidental duplicate submissions. Mitigation: rate limit, honeypot, maximum lengths,
and the admin queue. Do not add CAPTCHA for a school demo unless the form is publicly promoted.

**Acceptance criteria.**

- A valid submission creates a `pending` story and returns 201.
- Missing consent, a short body, an invalid email, or a filled honeypot returns 422.
- The fourth submission from one IP within an hour returns 429.
- The public API never exposes the submitted email address.
- The submission appears in the admin list with status `pending`.
- The submission does not appear on the public Stories page.

### P0-3. Public submission form

**Problem.** The Stories page is read-only, so visitors have no entry point for the new workflow.

**Proposed change.**

- Add a **Share your story** button to the Stories hero or the section below the story grid.
- Add a `/stories/submit` route and a `StorySubmit` page, lazy-loaded like the other pages.
- Form fields: name, email, role (optional), title, story, consent checkbox, and a hidden honeypot.
- Include a short content guideline: true story, music or community focus, no private contact
  details, plain text, editors may lightly edit for clarity.
- Show character counts for the title and body.
- Disable the submit button while the request is in progress.
- Show field-level server errors and a success panel that explains the review step.
- Do not show the story in the public list until it is approved.
- Keep the existing palette, typography, and responsive layout.

**Rationale.** WordPress and Ghost both provide a front-end submission path when a site accepts
contributions. A dedicated page keeps the Stories index focused and gives the form room for guidance
and validation.

**Estimated effort.** 1–1.5 focused days.

**Risk.** The form becomes a spam target or confuses users about publication. Mitigation: clear
guidelines, a consent checkbox, a success message that says “pending review,” and rate limiting.

**Acceptance criteria.**

- The Stories page has a visible **Share your story** action.
- The form is usable at 390px and desktop widths with no overflow.
- Every input has a visible label and an associated error message.
- Submitting valid content shows a success state, not an immediate public story.
- Refreshing the page does not resubmit the form.
- The form handles network and validation errors without losing the entered text.

### P0-4. Admin moderation queue

**Problem.** The current `StoriesAdmin` is a generic record manager. It can edit a story but has no
concept of pending submissions, approval, rejection, or a reason. The generic field renderer does not
support a status select or per-record workflow actions.

**Proposed change.**

- Add a dedicated **Submissions** section to the admin dashboard, or a clearly separated
  **Moderation queue** at the top of the Stories admin view.
- Show a pending count.
- List submissions with title, author, submission date, excerpt, and status.
- Allow the admin to open a full preview before deciding.
- Add **Approve** and **Reject** actions.
- Reject opens a small form with a required reason. Offer common reasons such as off-topic,
  inappropriate content, insufficient detail, privacy concern, or spam, plus an optional note.
- Approve sets `status = approved`, `published_at = now()`, `reviewed_by`, and `reviewed_at`.
- Reject sets `status = rejected`, stores the reason, and keeps the story private.
- Add filters for Pending, Approved, Rejected, and All.
- Refresh the list after each action and show a clear notice.
- Keep the existing story editor for content changes. Do not route status changes through the generic
  content update payload.
- Use a confirmation step for approval and rejection so a misclick does not publish or discard a
  submission.

**Rationale.** WordPress exposes pending posts in the admin and lets an editor publish or decline
them. A dedicated queue is simpler and safer than adding hidden status controls to a generic CRUD
form.

**Estimated effort.** 1.5–2 focused days.

**Risk.** The queue and the existing story list drift into two different sources of truth. Mitigation:
both read the same `stories` table and the same status field; only the actions differ.

**Acceptance criteria.**

- Pending submissions appear in the queue and not in the public list.
- The admin can preview the full body before deciding.
- Approve publishes the story and removes it from the pending queue.
- Reject requires a reason and leaves the story private.
- The queue filters work and show the correct counts.
- A non-admin cannot call the moderation endpoints.
- The existing admin story editor still works for admin-authored stories.

### P0-5. Public visibility and existing story updates

**Problem.** The public list, detail page, and tests currently depend on `is_published`. After the
status change, every read path must use the new rule consistently.

**Proposed change.**

- Update `StoryController` to query approved stories only.
- Update `Story::scopePublished()` or replace it with `scopeApproved()`.
- Update `StoryDetail` and `Stories` only where the API shape changes.
- Keep the existing story date, author, and sample label behavior.
- Ensure unapproved stories return 404, not an empty or partial page.
- Update `StorySeeder` so seeded launch stories are approved.
- Update `StoriesApiTest` expectations from `is_published` to status where appropriate.

**Rationale.** A single visibility rule prevents an approved story from disappearing or a pending
story from leaking. Tests should prove the rule at the API boundary, not only in the UI.

**Estimated effort.** 0.5–1 focused day.

**Risk.** One forgotten query still uses `is_published`. Mitigation: search the codebase for the old
field, remove it from public code, and add tests for pending and rejected stories.

**Acceptance criteria.**

- `GET /api/stories` returns only approved stories.
- `GET /api/stories/{slug}` returns 404 for pending and rejected stories.
- The public page does not show a pending or rejected story after a refresh.
- Approved stories continue to show their title, author, date, and body.
- No public code references `is_published` after the migration is complete.

### P0-6. Tests, seed data, and demo script

**Problem.** The existing tests cover the old read-only and CRUD behavior. They do not prove the new
workflow, and an empty queue makes the feature difficult to demonstrate.

**Proposed change.**

- Add API feature tests for submission, validation, rate limiting, moderation, privacy, and
  visibility.
- Add a frontend test for the submission form and the moderation actions.
- Add one Playwright flow: submit a story, sign in as admin, approve it, and see it on the public
  page.
- Add a second flow for rejection: reject with a reason and confirm the story stays private.
- Add a seeder with two pending submissions and one rejected submission, marked as sample data.
- Add `docs/stories-moderation.md` with the state machine, demo steps, and mail configuration.
- Run the existing frontend tests, Laravel tests, build, lint, and axe checks.

**Rationale.** A state machine is only trustworthy when the transitions are tested. Seeded demo data
also makes the presentation repeatable.

**Estimated effort.** 1–1.5 focused days.

**Risk.** Tests become brittle around email and timestamps. Mitigation: freeze time where needed,
use `Mail::fake()`, and assert status and visibility rather than exact formatted dates.

**Acceptance criteria.**

- The new API tests pass in the Laravel test suite.
- The browser flow passes in Playwright.
- Axe reports no critical or serious issues on the submission form and moderation queue.
- The seeder creates pending and rejected demo records without exposing them publicly.
- The demo script can be followed from a clean database.

## 8. P1 — quality and presentation polish

### P1-1. Email notifications

**Problem.** A submitter has no confirmation, and the admin has no alert when a story arrives. A
decision is invisible unless the author checks the site.

**Proposed change.**

- Send a confirmation to the author after submission.
- Notify the admin at a configurable `STORY_ADMIN_EMAIL`.
- Send an approval email with the public story link.
- Send a rejection email with the reason.
- Use Laravel Mailables with plain text or simple Markdown templates.
- Send after the database transaction commits. If mail fails, log a warning and keep the submission
  or decision; do not roll it back.
- Use `MAIL_MAILER=log` or `array` locally and in tests. Never commit real credentials.
- Add `Mail::fake()` assertions for each message.

**Rationale.** WordPress sends comment and registration notifications, and editorial systems normally
notify authors on acceptance. This is a small addition that makes the workflow feel complete.

**Estimated effort.** 1–1.5 focused days.

**Risk.** Mail failure blocking the workflow, or sending to the wrong address. Mitigation: send after
commit, catch failures, validate and normalize email, and keep the queue visible in the admin even if
mail fails.

**Acceptance criteria.**

- A successful submission sends one confirmation and one admin alert.
- Approval sends one acceptance email with the correct public link.
- Rejection sends one email containing the reason.
- Mail failure does not lose the story or change its status.
- Tests use the fake mailer and do not send real messages.

### P1-2. Moderation audit trail

**Problem.** The story row stores only the latest reviewer decision. There is no record of who did
what, or when a story moved between states.

**Proposed change.**

- Add a `story_moderation_events` table with story ID, action, actor ID, reason, and timestamp.
- Record `submitted`, `approved`, `rejected`, and `reopened` events in the same transaction as the
  status change.
- Show the latest event in the admin queue. A full history view is optional.
- Do not expose the audit trail publicly.

**Rationale.** Drupal and WordPress keep revision or moderation history for accountability. A small
event table demonstrates the concept without building a full audit system.

**Estimated effort.** 0.5–1 focused day.

**Risk.** Extra writes and complexity for a small project. Mitigation: keep the table append-only and
the UI limited to the latest event.

**Acceptance criteria.**

- Every status change creates one event with the correct actor and timestamp.
- A failed status change does not create an event.
- The admin can see who approved or rejected a story.
- Public responses do not include audit data.

### P1-3. Admin filters, counts, and pagination

**Problem.** A single unpaginated list is fine for a demo but becomes hard to use after several
submissions.

**Proposed change.**

- Filter by status.
- Show counts for pending, approved, and rejected.
- Add simple pagination or a sensible limit.
- Add a text search over title and author name if time allows.

**Rationale.** Moderation queues in WordPress and Drupal are filterable by status. This is a small
quality improvement, not a new subsystem.

**Estimated effort.** 0.5–1 focused day.

**Risk.** Overbuilding admin UI. Mitigation: implement filters and counts only; skip advanced search
until the queue is actually large.

**Acceptance criteria.**

- The admin can switch between status filters without a full page reload.
- Counts match the filtered results.
- The queue remains usable with at least 50 demo records.

### P1-4. Content guidelines, consent, and privacy copy

**Problem.** A submitter needs to know what will be published, who can see their email, and what
happens after submission.

**Proposed change.**

- Add a short “Before you submit” panel with content guidelines.
- Explain that name and story may be published, but email is private.
- Require a consent checkbox with links to the privacy and terms pages.
- Add a “What happens next” section to the success state.
- Add a moderation checklist for the admin: relevance, respect, privacy, consent, and spam.

**Rationale.** Publishing user-generated content requires informed consent. This is standard practice
for community submissions and is a low-effort improvement.

**Estimated effort.** 0.5 focused day.

**Risk.** Copy becomes long and discourages submissions. Mitigation: keep it short and scannable.

**Acceptance criteria.**

- The form explains public versus private information.
- Consent is required and stored with a timestamp.
- The success state explains that review is manual.
- The admin checklist is documented in `docs/stories-moderation.md`.

### P1-5. Accessibility pass

**Problem.** A new form and moderation queue can introduce unlabeled inputs, poor error handling, or
keyboard traps.

**Proposed change.**

- Associate every input with a label and an error message.
- Move focus to the success or error summary after submission.
- Use `aria-live` for submission and moderation notices.
- Ensure the reject dialog traps focus, closes with Escape, and returns focus to the trigger.
- Check contrast in both themes.
- Run axe on the submission page and the admin queue.

**Rationale.** WCAG 2.2 AA is the right target for a school project and is testable with the existing
axe setup.

**Estimated effort.** 0.5–1 focused day.

**Risk.** Custom modal behavior is easy to get wrong. Mitigation: use the existing dialog patterns in
the codebase or a small native `<dialog>` implementation.

**Acceptance criteria.**

- Keyboard-only users can complete the form and moderation actions.
- Errors are announced and linked to their fields.
- Axe reports no critical or serious issues on the new surfaces.
- Focus returns to a sensible place after dialogs close.

### P1-6. Spam and duplicate hardening

**Problem.** A public form can receive repeated or duplicate submissions, especially if the link is
shared beyond the class.

**Proposed change.**

- Keep the honeypot and per-IP throttle.
- Reject a duplicate when the same normalized email and title arrive within 24 hours.
- Normalize whitespace and trim the title.
- Optionally add Cloudflare Turnstile only if the form is publicly promoted.
- Log blocked attempts by reason, without storing the message body.

**Rationale.** Standard form protection for small community sites. Manual moderation remains the
primary defense.

**Estimated effort.** 0.5–1 focused day.

**Risk.** False positives for legitimate resubmissions. Mitigation: use a clear error message and allow
the admin to reopen or create a story manually.

**Acceptance criteria.**

- Duplicate submissions are rejected with a helpful message.
- The throttle and honeypot still work.
- No third-party CAPTCHA is required for the core demo.

### P1-7. Basic operational readiness

**Problem.** The feature adds a migration and user-generated data. A failed demo or a bad migration
would be difficult to recover from.

**Proposed change.**

- Run a `mysqldump` before applying the migration and before the presentation.
- Keep Laravel logs available and log moderation actions without emails or story bodies.
- Deploy the API migration before the frontend change.
- Add a smoke check: submit, approve, view public story, reject another, confirm it stays private.
- Document the local and deployed environment variables, including the admin notification address.

**Rationale.** This is the minimum operational care appropriate to a school project. It is not a
production backup or monitoring program.

**Estimated effort.** 0.5 focused day.

**Risk.** A migration failure or demo data loss. Mitigation: dump first, rehearse on a copy, and keep
the seed command repeatable.

**Acceptance criteria.**

- A pre-migration dump exists and can be restored locally.
- The smoke flow passes after deployment.
- Logs contain moderation actions but no private email addresses or full story bodies.
- The demo can be reset with a documented command.

### P1-8. Optional cover image URL

**Problem.** A story may benefit from a cover image, but file upload adds storage, validation, and
deployment complexity.

**Proposed change.**

- Add an optional `cover_image_url` field for external `https` images.
- Validate the scheme and host; reject local file paths.
- Show a preview before submission.
- Keep the existing `cover_image_path` for admin-managed images.
- Do not add upload, cropping, or image transformations in this phase.

**Rationale.** WordPress supports featured images, but a school project does not need a full media
library. An external URL is the smallest useful version.

**Estimated effort.** 0.5–1 focused day.

**Risk.** Broken or inappropriate external images. Mitigation: validate the URL, preview it, and let
the admin reject the submission.

**Acceptance criteria.**

- The form accepts a valid `https` image URL and shows a preview.
- Invalid or non-HTTPS URLs are rejected.
- Stories without an image still render correctly.
- The public story uses the existing image layout.

## 9. P2 — optional extensions

Only start these after P0 and the most valuable P1 items are complete.

### P2-1. Needs revision and resubmission

**Problem.** A rejection is currently final. Some stories could be accepted after small edits.

**Proposed change.** Add a `needs_revision` status, an author-facing revision note, and a resubmission
link with an expiring token. This adds a second workflow and should only be built if the demo needs
it.

**Effort.** 1–2 focused days. **Risk.** Token handling and email deliverability. **Acceptance.** An
author can revise and resubmit; the story returns to pending; the old version remains in the audit
trail.

### P2-2. Submission status lookup

**Problem.** Authors cannot check status without waiting for email.

**Proposed change.** Give each submission a random public reference code and a status page that shows
only the title, status, and decision reason. Do not expose email or body.

**Effort.** 1 focused day. **Risk.** Enumeration and privacy. **Acceptance.** A valid code shows the
status; an invalid code returns 404; no private fields are returned.

### P2-3. Image upload

**Problem.** External image URLs are fragile, and users may not have hosting.

**Proposed change.** Add a validated image upload with size and MIME limits, store it on a persistent
disk or object store, and generate one thumbnail. This requires a Railway volume or S3-compatible
storage and a `storage:link`.

**Effort.** 1–2 focused days. **Risk.** Lost files on redeploy and unsafe uploads. **Acceptance.**
Uploads survive a redeploy, invalid files are rejected, and the story renders the uploaded image.

### P2-4. Categories or tags

**Problem.** The story list is flat.

**Proposed change.** Add a small fixed category list and a filter on the public Stories page. Avoid
free-form tags, which require normalization and moderation.

**Effort.** 1 focused day. **Risk.** Scope creep. **Acceptance.** Stories can be filtered by category;
unapproved stories never appear.

### P2-5. Featured stories and simple counts

**Problem.** The Stories page has no way to highlight a strong story.

**Proposed change.** Add a boolean `is_featured` controlled by the admin and a small “featured” area
on the Stories page. Optionally count approved stories. Do not add likes or public reactions; they
create moderation and abuse work without serving the core goal.

**Effort.** 0.5 focused day. **Risk.** Minimal. **Acceptance.** At most one featured story renders;
the count matches approved stories only.

## 10. Data model and API reference

### Suggested story fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | bigint | Existing primary key |
| `title` | string | Public |
| `slug` | string, unique | Generated from the title |
| `excerpt` | string, 500 | Optional; derived from the body |
| `body` | long text | Plain text; paragraph breaks preserved |
| `author_name` | string | Public display name |
| `author_email` | string, nullable | Private; required for reader submissions |
| `author_role` | string, nullable | Optional public context |
| `status` | string, indexed | `draft`, `pending`, `approved`, `rejected` |
| `consent_at` | timestamp, nullable | Required for reader submissions |
| `reviewed_by` | foreign key, nullable | Admin user |
| `reviewed_at` | timestamp, nullable | Last decision time |
| `rejection_reason` | text, nullable | Required when rejected |
| `published_at` | timestamp, nullable | Set on approval |
| `is_sample` | boolean | Existing demo/seed marker |
| `created_at`, `updated_at` | timestamps | Existing |

### API endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/stories/submissions` | Public, throttled | Submit a story |
| `GET` | `/api/stories` | Public | List approved stories |
| `GET` | `/api/stories/{slug}` | Public | Show an approved story |
| `GET` | `/api/admin/stories?status=pending` | Admin | Moderation queue |
| `POST` | `/api/admin/stories/{story}/approve` | Admin | Approve and publish |
| `POST` | `/api/admin/stories/{story}/reject` | Admin | Reject with reason |
| `POST` | `/api/admin/stories/{story}/reopen` | Admin | Return a rejected story to pending |
| `POST/PUT/DELETE` | `/api/admin/stories...` | Admin | Existing content management, updated for status |

### Response rules

- The public story resource contains title, slug, excerpt, body, author name, author role, cover image,
  published date, and sample flag.
- The public resource never contains `author_email`, `status` transition metadata, reviewer identity,
  or rejection reason.
- The admin resource may contain all fields needed to moderate.
- A public request for a pending or rejected slug returns 404, not 403, to avoid revealing that the
  story exists.

## 11. Security and privacy checklist

- Public submission is rate-limited and honeypot-protected.
- Every submission field has server-side validation and a maximum length.
- Story bodies are plain text. Do not render raw HTML or use `dangerouslySetInnerHTML`.
- `status`, `reviewed_by`, `reviewed_at`, and `published_at` are not mass-assignable from the public
  endpoint.
- Admin moderation endpoints require Sanctum authentication and the existing admin middleware.
- The author email is visible only in admin responses and notification emails.
- Public responses use a separate resource that excludes private fields.
- Pending and rejected stories return 404 publicly.
- Logs do not contain emails, story bodies, tokens, or passwords.
- Consent is explicit and stored with a timestamp.
- No real credentials are committed. Local mail uses the log driver.

## 12. Accessibility checklist

- Visible labels for all inputs; placeholders are not labels.
- Required fields are identified in text, not by color alone.
- Errors are linked to fields and announced.
- Success and moderation notices use `aria-live`.
- The reject dialog is keyboard accessible and returns focus.
- The submission form works at 390px and desktop widths.
- Axe reports no critical or serious issues on the new pages.
- The admin queue can be operated without a mouse.

## 13. Testing matrix

| Layer | Cases |
| --- | --- |
| API | Valid submission; missing consent; short body; invalid email; honeypot; rate limit; duplicate; pending stays private; approved becomes public; rejected stays private; rejection reason required; non-admin cannot moderate; email never public |
| Model | Status transitions; approved scope; slug uniqueness; published timestamp on approval |
| Frontend | Form validation; server error mapping; success state; admin filters; approve/reject actions; reason required |
| Browser | Submit → admin approve → public story; submit → admin reject → still private |
| Accessibility | Axe on the form and queue; keyboard-only pass; focus return |
| Regression | Existing home, About, performances, settings, and admin CRUD tests still pass |

## 14. Demo and deployment checklist

1. Back up the local database with `mysqldump`.
2. Run the migration and seed the demo submissions.
3. Start the API and frontend locally; verify the submission form.
4. Sign in as the admin; verify the pending count and preview.
5. Approve one story; verify it appears publicly.
6. Reject another with a reason; verify it stays private.
7. Check the mail log or inbox if notifications are enabled.
8. Run `php artisan test`, `npm test`, `npm run build`, `npm run lint`, and the Playwright flow.
9. If deploying, apply the API migration first, then deploy the frontend.
10. Run the smoke flow against the deployed URL.

## 15. Out of scope

- Public user accounts, profiles, login, or email verification.
- Comments, likes, reactions, follows, or notifications centers.
- Rich-text or WYSIWYG editing, raw HTML, or embedded scripts.
- Image upload and a media library in P0; only an optional external image URL in P1.
- Multi-admin roles, reviewer assignment, or two-person approval.
- AI moderation, spam scoring, or automated rejection.
- Search, categories, tags, analytics, or recommendation features in P0.
- Replacing the custom CMS with WordPress, Strapi, or another platform.
- Production-scale backups, uptime monitoring, CDN tuning, or static generation.

## 16. Grounding in real CMS behavior

- **WordPress:** post statuses include draft, pending, and publish; pending posts are reviewed in the
  admin before they appear publicly. WordPress also has revisions and media libraries.
- **Drupal:** content moderation states and revision history are standard, but its workflow model is
  heavier than this project needs.
- **Strapi and similar headless CMS platforms:** draft and published states are first-class, and the
  public API normally exposes only published entries.
- **Ghost:** provides a focused editorial model with scheduled publishing and author notifications;
  this plan borrows the notification and status ideas without adopting the full platform.
- **Laravel:** Form Requests, policies or middleware, rate limiting, Mailables, database transactions,
  and feature tests provide the implementation primitives already used in this codebase.

The plan does not add features that these platforms do not have. It deliberately stops at the
smallest workflow that demonstrates the concept.

## 17. Recommended implementation order

1. P0-1: status model and migration.
2. P0-2: submission API and validation.
3. P0-5: visibility rules, so pending data never leaks.
4. P0-4: admin queue and approve/reject actions.
5. P0-3: public form and success state.
6. P0-6: tests, seed data, and demo script.
7. P1-1 and P1-4: notifications, consent, and privacy copy.
8. P1-2, P1-3, P1-5, P1-6: audit trail, filters, accessibility, and spam hardening.
9. P2 only if the core demo is complete and stable.
