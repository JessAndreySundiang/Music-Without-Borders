import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../components/cms/PageState";
import { IconArrowLeft, IconMusic, IconSparkle } from "../components/Icons";
import { fetchStoryBySlug } from "../lib/api";
import { paragraphs } from "../lib/section";
import { getCategoryLabel } from "../lib/storySubmission";
import { usePageContent } from "../lib/usePageContent";
import { usePageMeta } from "../lib/usePageTitle";
import type { Story } from "../types/Story";

function storyDate(value: string | null): string {
  if (!value) return "Coming soon";
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function StoryArticle({ story }: { story: Story }) {
  usePageMeta({
    page: "stories",
    fallbackTitle: "Notes from the Bandstand",
    fallbackDescription: "Progress reports and stories from the people the band has helped.",
    title: story.title,
    description: story.excerpt ?? undefined,
  });

  return (
    <>
      <section className="stage relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_30px,var(--stage-staff)_30px_32px)]" />
        </div>
        <div className="mx-auto w-full max-w-4xl px-5 py-14 md:py-20">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-4 py-2 text-xs font-bold text-stage-fg backdrop-blur-sm transition-colors hover:bg-stage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
          >
            <IconArrowLeft className="size-4" />
            All stories
          </Link>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-tile-fg">
              <IconSparkle className="size-3.5" />
              Notes from the Bandstand
            </span>
            <span className="rounded-full border border-stage-line-strong bg-stage-glass-strong px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-tile-fg">
              {getCategoryLabel(story.category)}
            </span>
            {story.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-brass-bright/40 bg-amber-400/20 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-amber-300">
                <IconSparkle className="size-3" />
                Featured story
              </span>
            )}
            {story.is_sample && (
              <span className="rounded-full border border-brass/35 bg-brass/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-brass">
                Sample story
              </span>
            )}
          </div>

          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-stage-fg md:text-6xl">
            {story.title}
          </h1>
          {story.excerpt && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stage-muted">
              {story.excerpt}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stage-muted">
            <span className="font-bold text-stage-fg">
              {story.author_name ?? "Music Without Borders"}
            </span>
            {story.author_role && <span>{story.author_role}</span>}
            <span aria-hidden="true">·</span>
            <span>{storyDate(story.published_at)}</span>
          </div>
        </div>
      </section>

      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-4xl px-5 py-16 md:py-20">
          {story.cover_image_url && (
            <img
              src={story.cover_image_url}
              alt=""
              className="mb-12 aspect-[16/8] w-full rounded-3xl border border-line object-cover shadow-lg"
            />
          )}

          <article className="mx-auto max-w-3xl">
            <div className="space-y-6 text-lg leading-[1.85] text-body">
              {paragraphs(story.body).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-14 flex flex-col gap-5 rounded-3xl border border-line bg-surface p-7 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brass/10 text-brass">
                  <IconMusic className="size-6" />
                </span>
                <div>
                  <p className="font-serif text-lg font-semibold text-ink">
                    More notes from the bandstand
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Small moments from a volunteer band in Pampanga.
                  </p>
                </div>
              </div>
              <Link
                to="/stories"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brass-bright px-5 py-2.5 text-sm font-bold text-night-950 transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
              >
                Read all stories
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

function StoryDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const loader = useCallback(() => fetchStoryBySlug(slug), [slug]);
  const { data, loading, error, reload } = usePageContent(loader);

  usePageMeta({
    page: "stories",
    fallbackTitle: "Notes from the Bandstand",
    fallbackDescription: "Progress reports and stories from the people the band has helped.",
  });

  if (loading && !data) return <PageLoading label="Opening the notebook…" />;

  if (error && !data) {
    return (
      <PageError
        title="That story could not be found"
        message="It may have been moved, unpublished, or the link may be incomplete."
        onRetry={reload}
      />
    );
  }

  if (!data) return null;

  return <StoryArticle story={data} />;
}

export default StoryDetail;
