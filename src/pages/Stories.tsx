import { useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { PageEmpty, PageError, PageLoading } from "../components/cms/PageState";
import { IconArrowRight, IconMusic, IconSparkle } from "../components/Icons";
import { fetchStories } from "../lib/api";
import { STORY_CATEGORIES, getCategoryLabel } from "../lib/storySubmission";
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

function StoryCard({ story, index }: { story: Story; index: number }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass/50 hover:shadow-xl">
      <div className="relative aspect-[16/9] overflow-hidden bg-paper-2">
        {story.cover_image_url ? (
          <img
            src={story.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading={index > 2 ? "lazy" : "eager"}
          />
        ) : (
          <div className="stage relative flex h-full items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_24px,var(--stage-staff)_24px_26px)] opacity-60"
            />
            <span className="relative grid size-20 place-items-center rounded-full border border-stage-ring bg-stage-glass-strong text-brass shadow-lg">
              <IconMusic className="size-9" />
            </span>
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {story.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brass-bright/40 bg-night-950/90 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-300 shadow-sm backdrop-blur-xs">
              <IconSparkle className="size-3" />
              Featured
            </span>
          )}
          <span className="rounded-full border border-line bg-paper/95 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted shadow-sm">
            {getCategoryLabel(story.category)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-widest text-brass">
          <IconSparkle className="size-3.5" />
          Notes from the Bandstand
        </div>
        <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-brass">
          <Link to={`/stories/${story.slug}`} className="focus-visible:outline-brass-bright">
            {story.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {story.excerpt ?? story.body}
        </p>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-line/60 pt-5">
          <div>
            <p className="text-xs font-bold text-ink">
              {story.author_name ?? "Music Without Borders"}
            </p>
            <p className="mt-0.5 text-xs text-muted">{storyDate(story.published_at)}</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-brass transition-colors group-hover:bg-brass-bright group-hover:text-night-950">
            <IconArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

function FeaturedStoryCard({ story }: { story: Story }) {
  return (
    <article
      data-testid="featured-story"
      className="group mb-12 flex flex-col overflow-hidden rounded-3xl border border-brass/50 bg-surface shadow-md transition-all duration-300 hover:shadow-xl lg:flex-row"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-paper-2 lg:aspect-auto lg:w-1/2">
        {story.cover_image_url ? (
          <img
            src={story.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="eager"
          />
        ) : (
          <div className="stage relative flex h-full min-h-64 items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_24px,var(--stage-staff)_24px_26px)] opacity-60"
            />
            <span className="relative grid size-24 place-items-center rounded-full border border-stage-ring bg-stage-glass-strong text-brass shadow-lg">
              <IconMusic className="size-11" />
            </span>
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brass-bright/40 bg-night-950/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 shadow-sm backdrop-blur-xs">
            <IconSparkle className="size-3.5" />
            Featured story
          </span>
          <span className="rounded-full border border-line bg-paper/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted shadow-sm">
            {getCategoryLabel(story.category)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-7 lg:p-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brass">
            <IconSparkle className="size-3.5" />
            Notes from the Bandstand
          </div>
          <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-brass md:text-3xl">
            <Link to={`/stories/${story.slug}`} className="focus-visible:outline-brass-bright">
              {story.title}
            </Link>
          </h2>
          <p className="mt-4 line-clamp-4 text-base leading-relaxed text-muted">
            {story.excerpt ?? story.body}
          </p>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4 border-t border-line/60 pt-6">
          <div>
            <p className="text-sm font-bold text-ink">
              {story.author_name ?? "Music Without Borders"}
              {story.author_role && (
                <span className="font-normal text-muted"> · {story.author_role}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted">{storyDate(story.published_at)}</p>
          </div>
          <Link
            to={`/stories/${story.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brass-bright px-5 py-2.5 text-xs font-bold text-night-950 shadow-sm transition-all hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
          >
            Read story
            <IconArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Stories() {
  usePageMeta({
    page: "stories",
    fallbackTitle: "Notes from the Bandstand",
    fallbackDescription: "Progress reports and stories from the people the band has helped.",
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data, loading, error, reload } = usePageContent(fetchStories);

  const filteredData =
    selectedCategory === "all"
      ? (data ?? [])
      : (data?.filter((story) => story.category === selectedCategory) ?? []);

  const featuredStory = filteredData.find((story) => story.is_featured);
  const regularStories = featuredStory
    ? filteredData.filter((story) => story.id !== featuredStory.id)
    : filteredData;

  return (
    <>
      <PageHero
        eyebrow="Stories"
        title="Notes from the Bandstand"
        text="Progress reports, small victories, and the people behind the music. These are the moments that do not fit on a concert poster."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/stories/submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brass-bright px-5 py-3 text-sm font-bold text-night-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
          >
            Share your story
            <IconArrowRight className="size-4" />
          </Link>
        </div>
      </PageHero>

      {loading && !data ? (
        <PageLoading label="Collecting notes from the bandstand…" />
      ) : error && !data ? (
        <PageError
          title="The notebook is out of reach"
          message="We could not load the band's stories. Please check your connection and try again."
          onRetry={reload}
        />
      ) : !data || data.length === 0 ? (
        <PageEmpty
          title="The next story is still being written"
          message="Our volunteers are gathering notes from rehearsals and concerts. Please check back soon."
        />
      ) : (
        <section className="band bg-paper" data-state="ready">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brass">
                  From the band
                </p>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                  Real notes from rehearsals, lending-library mornings, and plaza concerts.
                </p>
              </div>
              <p className="text-xs font-semibold text-muted">
                {filteredData.length} of {data.length} {data.length === 1 ? "story" : "stories"}
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div
              role="group"
              aria-label="Filter stories by category"
              className="mb-8 flex flex-wrap items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  selectedCategory === "all"
                    ? "bg-brass-bright text-night-950 shadow-sm"
                    : "border border-line bg-surface text-ink hover:border-brass/40 hover:text-brass"
                }`}
              >
                All stories ({data.length})
              </button>
              {STORY_CATEGORIES.map((cat) => {
                const count = data.filter((s) => s.category === cat.value).length;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      selectedCategory === cat.value
                        ? "bg-brass-bright text-night-950 shadow-sm"
                        : "border border-line bg-surface text-ink hover:border-brass/40 hover:text-brass"
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            {featuredStory && <FeaturedStoryCard story={featuredStory} />}

            {regularStories.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {regularStories.map((story, index) => (
                  <StoryCard key={story.id} story={story} index={index} />
                ))}
              </div>
            ) : !featuredStory ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
                <IconMusic className="mx-auto size-7 text-brass" />
                <p className="mt-2 font-serif text-lg font-semibold text-ink">
                  No stories found in this category
                </p>
                <p className="mt-1 text-sm text-muted">Try another category or view all stories.</p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2 text-xs font-bold text-ink hover:border-brass/40 hover:text-brass"
                >
                  View all stories
                </button>
              </div>
            ) : null}

            <div className="mt-12 flex flex-col gap-5 rounded-3xl border border-line bg-surface p-7 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-serif text-lg font-semibold text-ink">
                  Have a story from your own corner of the bandstand?
                </p>
                <p className="mt-1 text-sm text-muted">
                  Send it for review. Nothing is published until an editor approves it.
                </p>
              </div>
              <Link
                to="/stories/submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:border-brass/40 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
              >
                Share your story
                <IconArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Stories;
