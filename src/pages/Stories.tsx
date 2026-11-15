import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { PageEmpty, PageError, PageLoading } from "../components/cms/PageState";
import { IconArrowRight, IconMusic, IconSparkle } from "../components/Icons";
import { fetchStories } from "../lib/api";
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
        {story.is_sample && (
          <span className="absolute left-4 top-4 rounded-full border border-brass/40 bg-paper/95 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-brass shadow-sm">
            Sample story
          </span>
        )}
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
              {story.author_name ?? "Community Music Band"}
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

function Stories() {
  usePageMeta({
    page: "stories",
    fallbackTitle: "Notes from the Bandstand",
    fallbackDescription: "Progress reports and stories from the people the band has helped.",
  });

  const { data, loading, error, reload } = usePageContent(fetchStories);

  return (
    <>
      <PageHero
        eyebrow="Stories"
        title="Notes from the Bandstand"
        text="Progress reports, small victories, and the people behind the music. These are the moments that do not fit on a concert poster."
      />

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
        <section className="band bg-paper">
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
                {data.length} {data.length === 1 ? "story" : "stories"}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.map((story, index) => (
                <StoryCard key={story.id} story={story} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Stories;
