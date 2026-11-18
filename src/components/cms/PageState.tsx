import { IconAlert, IconMusic, IconSpinner } from "../Icons";

export function PageLoading({ label = "Loading the latest from the band…" }: { label?: string }) {
  return (
    <section className="band bg-paper" aria-busy="true" aria-live="polite" data-state="loading">
      <div className="mx-auto w-full max-w-6xl px-5 py-24">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted">
          <IconSpinner className="size-5 animate-spin text-brass" />
          {label}
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-3xl border border-line bg-surface"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type PageErrorProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function PageEmpty({
  title = "Nothing here just yet",
  message = "The band is preparing this page. Please check back soon.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <section className="band bg-paper" data-state="empty">
      <div className="mx-auto w-full max-w-2xl px-5 py-24">
        <div className="rounded-3xl border border-dashed border-line bg-surface p-8 text-center shadow-sm">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brass/10 text-brass">
            <IconMusic className="size-6" />
          </span>
          <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-3 text-body">{message}</p>
        </div>
      </div>
    </section>
  );
}

export function PageError({
  title = "We couldn't load this page",
  message = "The band's website is having trouble reaching the content server. Please try again.",
  onRetry,
}: PageErrorProps) {
  return (
    <section className="band bg-paper" data-state="error">
      <div className="mx-auto w-full max-w-2xl px-5 py-24">
        <div className="rounded-3xl border border-line bg-surface p-8 shadow-sm">
          <span className="grid size-12 place-items-center rounded-2xl bg-plume/10 text-plume">
            <IconAlert className="size-6" />
          </span>
          <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-3 text-body">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brass-bright px-5 py-3 text-sm font-bold text-night-950 transition-colors hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
