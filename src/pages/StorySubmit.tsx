import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheckCircle,
  IconInfo,
  IconMusic,
  IconSparkle,
} from "../components/Icons";
import { StorySubmissionError, fetchStoryStatus, submitStory } from "../lib/api";
import {
  EMPTY_STORY_SUBMISSION,
  STORY_AUTHOR_NAME_MAX,
  STORY_AUTHOR_ROLE_MAX,
  STORY_BODY_MAX,
  STORY_BODY_MIN,
  STORY_CATEGORIES,
  STORY_TITLE_MAX,
  getCategoryLabel,
  isValidHttpsUrl,
  mapStorySubmissionErrors,
  validateStorySubmission,
  type StorySubmissionFieldErrors,
  type StorySubmissionValues,
} from "../lib/storySubmission";
import { usePageMeta } from "../lib/usePageTitle";
import type { StoryCategory, StoryStatusInfo } from "../types/Story";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20 aria-[invalid=true]:border-plume/60";
const textareaClass = `${inputClass} min-h-48 resize-y leading-relaxed`;
const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-muted";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brass-bright px-5 py-3 text-sm font-bold text-night-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brass/40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright";

const fieldOrder: Array<[keyof StorySubmissionFieldErrors, string]> = [
  ["title", "story-title"],
  ["category", "story-category"],
  ["author_name", "story-author-name"],
  ["author_email", "story-author-email"],
  ["author_role", "story-author-role"],
  ["cover_image_url", "story-cover-image-url"],
  ["body", "story-body"],
  ["consent", "story-consent"],
];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs font-semibold text-plume">
      {message}
    </p>
  );
}

function StorySubmit() {
  usePageMeta({
    page: "stories",
    fallbackTitle: "Share your story",
    fallbackDescription:
      "Send a true story about music and community to Music Without Borders for review.",
    title: "Share your story",
    description: "Send a true story about music and community to Music Without Borders for review.",
  });

  const [values, setValues] = useState<StorySubmissionValues>({ ...EMPTY_STORY_SUBMISSION });
  const [errors, setErrors] = useState<StorySubmissionFieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  // Status lookup state
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState<StoryStatusInfo | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof StorySubmissionValues>(
    field: K,
    value: StorySubmissionValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field !== "website") {
      setErrors((current) => {
        const next = { ...current };
        delete next[field as keyof StorySubmissionFieldErrors];
        return next;
      });
    }
  };

  const focusFirstError = (fieldErrors: StorySubmissionFieldErrors) => {
    const first = fieldOrder.find(([field]) => fieldErrors[field]);
    if (first) document.getElementById(first[1])?.focus();
    else errorSummaryRef.current?.focus();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    setGeneralError(null);
    const nextErrors = validateStorySubmission(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setGeneralError("Please check the highlighted fields and try again.");
      window.requestAnimationFrame(() => focusFirstError(nextErrors));
      return;
    }

    setBusy(true);

    try {
      const result = await submitStory({
        title: values.title.trim(),
        category: values.category,
        author_name: values.author_name.trim(),
        author_email: values.author_email.trim(),
        author_role: values.author_role.trim() || undefined,
        body: values.body.trim(),
        cover_image_url: values.cover_image_url.trim() || undefined,
        consent: values.consent,
        website: values.website,
      });

      setValues({ ...EMPTY_STORY_SUBMISSION });
      setErrors({});
      setSuccess(result.message);
      setReferenceCode(result.reference_code ?? null);
      window.requestAnimationFrame(() => successRef.current?.focus());
    } catch (reason) {
      if (reason instanceof StorySubmissionError) {
        const mapped = mapStorySubmissionErrors(reason.errors);
        const hasFieldErrors = Object.keys(mapped.fieldErrors).length > 0;

        setErrors(mapped.fieldErrors);
        setGeneralError(
          mapped.generalError ??
            (hasFieldErrors
              ? "Please check the highlighted fields and try again."
              : reason.message),
        );

        window.requestAnimationFrame(() => {
          if (hasFieldErrors) focusFirstError(mapped.fieldErrors);
          else errorSummaryRef.current?.focus();
        });
      } else {
        setGeneralError(
          "We could not reach the server. Your story is still here — check your connection and try again.",
        );
        window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      }
    } finally {
      setBusy(false);
    }
  };

  const startAnother = () => {
    setSuccess(null);
    setReferenceCode(null);
    setGeneralError(null);
    setErrors({});
    window.requestAnimationFrame(() => document.getElementById("story-title")?.focus());
  };

  const handleLookupStatus = async (event: FormEvent) => {
    event.preventDefault();
    const code = lookupCode.trim().toUpperCase();
    if (!code) return;

    setLookupBusy(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const data = await fetchStoryStatus(code);
      setLookupResult(data);
    } catch {
      setLookupError(
        `No story was found with reference code "${code}". Please verify the code and try again.`,
      );
    } finally {
      setLookupBusy(false);
    }
  };

  const hasErrors = Boolean(generalError) || Object.keys(errors).length > 0;

  return (
    <>
      <PageHero
        eyebrow="Share your story"
        title="Every good story starts with someone listening."
        text="Tell us about a moment when music brought people together. A first lesson, a borrowed instrument, a plaza concert, or a quiet act of help behind the scenes — we would like to hear it."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/stories" className={secondaryButton}>
            <IconArrowLeft className="size-4" />
            Back to stories
          </Link>
        </div>
      </PageHero>

      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-3xl px-5 py-14 md:py-20">
          <div className="rounded-3xl border border-brass/25 bg-brass/5 p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brass/10 text-brass">
                <IconInfo className="size-5" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-semibold text-ink">Before you submit</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  A person reads every submission before anything appears on the site.
                </p>
              </div>
            </div>
            <ul className="mt-5 grid gap-2.5 text-sm leading-relaxed text-body sm:grid-cols-2">
              {[
                "Tell a true story with a music or community focus.",
                "Write in plain text. Paragraph breaks are preserved.",
                "Leave out private contact details and other people's personal information.",
                "Editors may lightly edit for clarity, spelling, and length.",
              ].map((guideline) => (
                <li key={guideline} className="flex gap-2">
                  <IconSparkle className="mt-0.5 size-3.5 shrink-0 text-brass" />
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-3 border-t border-brass/20 pt-5 text-sm sm:grid-cols-2">
              <p className="flex gap-2 text-body">
                <IconCheckCircle className="mt-0.5 size-4 shrink-0 text-brass" />
                <span>
                  <strong className="font-bold text-ink">Public after approval:</strong> your name,
                  optional role, title, and story.
                </span>
              </p>
              <p className="flex gap-2 text-body">
                <IconInfo className="mt-0.5 size-4 shrink-0 text-brass" />
                <span>
                  <strong className="font-bold text-ink">Always private:</strong> your email
                  address, consent record, and moderator notes.
                </span>
              </p>
            </div>
          </div>

          <div className="mt-8">
            {success ? (
              <div
                ref={successRef}
                tabIndex={-1}
                role="status"
                aria-live="polite"
                className="rounded-3xl border border-brass/30 bg-surface p-7 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright sm:p-9"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-brass/10 text-brass">
                  <IconCheckCircle className="size-7" />
                </span>
                <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink">
                  Your story is pending review
                </h2>
                <p className="mt-3 text-body">{success}</p>
                {referenceCode && (
                  <div className="mt-5 rounded-2xl border border-brass/40 bg-paper p-5 text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      Your Reference Tracking Code
                    </p>
                    <p
                      data-testid="reference-code-display"
                      className="mt-1 font-mono text-2xl font-bold tracking-wider text-brass"
                    >
                      {referenceCode}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Keep this code to check your submission review status at any time.
                    </p>
                  </div>
                )}
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  An administrator will read the full story before deciding whether to publish it.
                  If it is approved, it will appear on the Stories page. Your email address will
                  never be shown publicly.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button type="button" onClick={startAnother} className={primaryButton}>
                    Share another story
                    <IconArrowRight className="size-4" />
                  </button>
                  <Link to="/stories" className={secondaryButton}>
                    Back to stories
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                noValidate
                className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brass/10 text-brass">
                    <IconMusic className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-ink">Your story</h2>
                    <p className="mt-1 text-sm text-muted">
                      Required fields are marked with an asterisk.
                    </p>
                  </div>
                </div>

                {hasErrors && (
                  <div
                    ref={errorSummaryRef}
                    tabIndex={-1}
                    role="alert"
                    className="mt-5 rounded-xl border border-plume/30 bg-plume/10 px-4 py-3 text-sm text-plume focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plume"
                  >
                    <p className="font-bold">Please check the form.</p>
                    {generalError && <p className="mt-1">{generalError}</p>}
                    {Object.keys(errors).length > 0 && (
                      <ul className="mt-2 list-inside list-disc space-y-0.5">
                        {fieldOrder.map(([field]) =>
                          errors[field] ? <li key={field}>{errors[field]}</li> : null,
                        )}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="story-author-name" className={labelClass}>
                      Your name <span className="text-plume">*</span>
                    </label>
                    <input
                      id="story-author-name"
                      name="author_name"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={STORY_AUTHOR_NAME_MAX}
                      value={values.author_name}
                      onChange={(event) => update("author_name", event.target.value)}
                      aria-invalid={Boolean(errors.author_name)}
                      aria-describedby={errors.author_name ? "story-author-name-error" : undefined}
                      className={inputClass}
                      placeholder="The name that should appear with the story"
                    />
                    <FieldError id="story-author-name-error" message={errors.author_name} />
                  </div>

                  <div>
                    <label htmlFor="story-author-email" className={labelClass}>
                      Email address <span className="text-plume">*</span>
                    </label>
                    <input
                      id="story-author-email"
                      name="author_email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      maxLength={255}
                      value={values.author_email}
                      onChange={(event) => update("author_email", event.target.value)}
                      aria-invalid={Boolean(errors.author_email)}
                      aria-describedby={
                        errors.author_email
                          ? "story-author-email-help story-author-email-error"
                          : "story-author-email-help"
                      }
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                    <p id="story-author-email-help" className="mt-1.5 text-xs text-muted">
                      Private. We only use it to contact you about this submission.
                    </p>
                    <FieldError id="story-author-email-error" message={errors.author_email} />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="story-author-role" className={labelClass}>
                      Role or relationship{" "}
                      <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      id="story-author-role"
                      name="author_role"
                      type="text"
                      maxLength={STORY_AUTHOR_ROLE_MAX}
                      value={values.author_role}
                      onChange={(event) => update("author_role", event.target.value)}
                      aria-invalid={Boolean(errors.author_role)}
                      aria-describedby={
                        errors.author_role
                          ? "story-author-role-help story-author-role-error"
                          : "story-author-role-help"
                      }
                      className={inputClass}
                      placeholder="Student, volunteer, audience member…"
                    />
                    <p id="story-author-role-help" className="mt-1.5 text-xs text-muted">
                      Shown publicly if you provide one.
                    </p>
                    <FieldError id="story-author-role-error" message={errors.author_role} />
                  </div>

                  <div>
                    <label htmlFor="story-category" className={labelClass}>
                      Story category
                    </label>
                    <select
                      id="story-category"
                      name="category"
                      value={values.category}
                      onChange={(event) => update("category", event.target.value as StoryCategory)}
                      className={inputClass}
                    >
                      {STORY_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p id="story-category-help" className="mt-1.5 text-xs text-muted">
                      Helps readers discover your story by topic.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="story-cover-image-url" className={labelClass}>
                    Cover image URL <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    id="story-cover-image-url"
                    name="cover_image_url"
                    type="url"
                    maxLength={2048}
                    value={values.cover_image_url}
                    onChange={(event) => update("cover_image_url", event.target.value)}
                    aria-invalid={Boolean(errors.cover_image_url)}
                    aria-describedby={
                      errors.cover_image_url
                        ? "story-cover-image-url-help story-cover-image-url-error"
                        : "story-cover-image-url-help"
                    }
                    className={inputClass}
                    placeholder="https://example.com/photo.jpg"
                  />
                  <p id="story-cover-image-url-help" className="mt-1.5 text-xs text-muted">
                    Optional link to a public photo (must start with https://).
                  </p>
                  <FieldError id="story-cover-image-url-error" message={errors.cover_image_url} />

                  {values.cover_image_url.trim() &&
                    !errors.cover_image_url &&
                    isValidHttpsUrl(values.cover_image_url.trim()) && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-paper p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                          Image preview
                        </p>
                        <div className="relative aspect-video max-h-48 w-full overflow-hidden rounded-lg bg-surface">
                          <img
                            src={values.cover_image_url.trim()}
                            alt="Cover preview"
                            className="size-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                              const fallback =
                                e.currentTarget.parentElement?.querySelector(".img-fallback");
                              if (fallback) (fallback as HTMLElement).classList.remove("hidden");
                            }}
                          />
                          <div className="img-fallback hidden absolute inset-0 grid place-items-center p-4 text-center text-xs text-muted">
                            Preview not available. Please verify the URL points directly to an
                            image.
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <label htmlFor="story-title" className={labelClass}>
                      Story title <span className="text-plume">*</span>
                    </label>
                    <p
                      id="story-title-count"
                      className={`mb-2 text-xs font-semibold ${
                        values.title.length > STORY_TITLE_MAX ? "text-plume" : "text-muted"
                      }`}
                    >
                      {values.title.length}/{STORY_TITLE_MAX}
                    </p>
                  </div>
                  <input
                    id="story-title"
                    name="title"
                    type="text"
                    required
                    maxLength={STORY_TITLE_MAX}
                    value={values.title}
                    onChange={(event) => update("title", event.target.value)}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={
                      errors.title ? "story-title-count story-title-error" : "story-title-count"
                    }
                    className={inputClass}
                    placeholder="A short title for your story"
                  />
                  <FieldError id="story-title-error" message={errors.title} />
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <label htmlFor="story-body" className={labelClass}>
                      Your story <span className="text-plume">*</span>
                    </label>
                    <p
                      id="story-body-count"
                      className={`mb-2 text-xs font-semibold ${
                        values.body.length > STORY_BODY_MAX ? "text-plume" : "text-muted"
                      }`}
                    >
                      {values.body.length.toLocaleString("en-PH")}/
                      {STORY_BODY_MAX.toLocaleString("en-PH")}
                    </p>
                  </div>
                  <textarea
                    id="story-body"
                    name="body"
                    required
                    maxLength={STORY_BODY_MAX}
                    rows={12}
                    value={values.body}
                    onChange={(event) => update("body", event.target.value)}
                    aria-invalid={Boolean(errors.body)}
                    aria-describedby={
                      errors.body
                        ? "story-body-help story-body-count story-body-error"
                        : "story-body-help story-body-count"
                    }
                    className={textareaClass}
                    placeholder="Tell us what happened, who was there, and why it mattered."
                  />
                  <p id="story-body-help" className="mt-1.5 text-xs text-muted">
                    At least {STORY_BODY_MIN} characters. Leave a blank line between paragraphs.
                  </p>
                  <FieldError id="story-body-error" message={errors.body} />
                </div>

                <div className="mt-6">
                  <div className="rounded-xl border border-line bg-paper p-4">
                    <div className="flex items-start gap-3">
                      <input
                        id="story-consent"
                        name="consent"
                        type="checkbox"
                        required
                        checked={values.consent}
                        onChange={(event) => update("consent", event.target.checked)}
                        aria-invalid={Boolean(errors.consent)}
                        aria-describedby={`story-consent-help${
                          errors.consent ? " story-consent-error" : ""
                        }`}
                        className="mt-0.5 size-4 shrink-0 accent-[var(--brass-bright)]"
                      />
                      <div>
                        <label htmlFor="story-consent" className="text-sm font-bold text-ink">
                          I agree to publication.
                        </label>
                        <p
                          id="story-consent-help"
                          className="mt-1 text-sm leading-relaxed text-body"
                        >
                          I confirm that this is my story to share and that Music Without Borders
                          may publish my name, optional role, title, and story after review. I
                          understand that my email address stays private. See the{" "}
                          <Link
                            to="/privacy"
                            className="font-semibold text-brass underline decoration-brass/40 underline-offset-2 hover:decoration-brass"
                          >
                            privacy page
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                  <FieldError id="story-consent-error" message={errors.consent} />
                </div>

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
                >
                  <label htmlFor="story-website">Website</label>
                  <input
                    id="story-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={(event) => update("website", event.target.value)}
                  />
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                  <p className="text-xs text-muted">
                    Submitting does not publish the story. An administrator reviews it first.
                  </p>
                  <button type="submit" className={primaryButton} disabled={busy}>
                    {busy ? "Sending your story…" : "Submit for review"}
                    {!busy && <IconArrowRight className="size-4" />}
                  </button>
                </div>
              </form>
            )}

            {/* Status Lookup Panel */}
            <div className="mt-12 rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brass/10 text-brass">
                  <IconSparkle className="size-5" />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-ink">
                    Track your submission
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Have a tracking reference code from an earlier submission? Enter it below to
                    check its review status.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLookupStatus} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label htmlFor="lookup-code" className="sr-only">
                    Reference Tracking Code
                  </label>
                  <input
                    id="lookup-code"
                    type="text"
                    required
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                    placeholder="e.g. MWB-ABCD1234"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookupBusy || !lookupCode.trim()}
                  className={secondaryButton}
                >
                  {lookupBusy ? "Checking…" : "Check status"}
                </button>
              </form>

              {lookupError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-plume/30 bg-plume/10 px-4 py-3 text-sm text-plume"
                >
                  {lookupError}
                </div>
              )}

              {lookupResult && (
                <div
                  data-testid="lookup-result-card"
                  className="mt-6 rounded-2xl border border-brass/30 bg-paper p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                    <span className="font-mono text-xs font-bold tracking-wider text-brass">
                      {lookupResult.reference_code}
                    </span>
                    <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">
                      {getCategoryLabel(lookupResult.category)}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-semibold text-ink">
                    {lookupResult.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted">Current status:</span>
                    {lookupResult.status === "approved" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <IconCheckCircle className="size-3" />
                        Approved & Published
                      </span>
                    )}
                    {lookupResult.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <IconInfo className="size-3" />
                        Pending Review
                      </span>
                    )}
                    {lookupResult.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-plume/30 bg-plume/10 px-2.5 py-0.5 text-xs font-bold text-plume">
                        Not Published
                      </span>
                    )}
                    {lookupResult.status === "draft" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-bold text-muted">
                        Draft
                      </span>
                    )}
                  </div>
                  {lookupResult.rejection_reason && (
                    <div className="mt-4 rounded-xl border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
                      <strong className="font-bold text-ink">Editorial feedback: </strong>
                      {lookupResult.rejection_reason}
                    </div>
                  )}
                  {lookupResult.status === "approved" && (
                    <div className="mt-4">
                      <Link
                        to="/stories"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brass hover:underline"
                      >
                        View published stories
                        <IconArrowRight className="size-3" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default StorySubmit;
