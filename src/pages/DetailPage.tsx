import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  IconArrowLeft,
  IconClock,
  IconMapPin,
  IconMusic,
  IconSparkle,
  IconSpinner,
  IconAlert,
  IconHeart,
} from "../components/Icons";
import SampleNotice from "../components/cms/SampleNotice";
import { fetchPerformanceById } from "../lib/api";
import { eventDateParts, formatTime } from "../lib/events";
import { usePageMeta } from "../lib/usePageTitle";
import type { Performance } from "../types/Performance";

const eventTypeColors: Record<string, string> = {
  Concert: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Parade: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Outdoor Festival":
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Community Outreach":
    "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  "Charity Gala": "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    page: "performances",
    fallbackTitle: "Performance Details",
    title: performance?.title ?? "Performance Details",
    description: performance?.description,
  });

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    fetchPerformanceById(id)
      .then((data) => {
        if (isMounted) {
          setPerformance(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setPerformance(null);
          setError(err instanceof Error ? err.message : "Failed to load performance details");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // If the route changes while the previous record is still in state, keep the
  // loading state until the new record arrives instead of showing stale details.
  const isLoading = loading || (performance !== null && String(performance.id) !== id);

  const dateParts = performance ? eventDateParts(performance.performance_date) : null;
  const badgeColor =
    performance && eventTypeColors[performance.event_type]
      ? eventTypeColors[performance.event_type]
      : "border-line bg-surface text-muted";

  return (
    <>
      {/* Top Banner / Stage Hero */}
      <section className="stage relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_30px,var(--stage-staff)_30px_32px)]" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-5 py-12 md:py-16">
          {/* Back links: to Home and to Performances schedule */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-4 py-2 text-xs font-bold text-stage-fg backdrop-blur-sm transition-all hover:bg-stage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
            >
              <IconArrowLeft className="size-4" />
              Back to Home
            </Link>
            <Link
              to="/performances"
              className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-4 py-2 text-xs font-bold text-stage-muted backdrop-blur-sm transition-all hover:text-stage-fg hover:bg-stage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
            >
              All Performances
            </Link>
          </div>

          {/* Loading Hero */}
          {isLoading && (
            <div className="py-16 text-center">
              <IconSpinner className="size-10 animate-spin text-brass mx-auto" />
              <p className="mt-4 font-serif text-lg text-stage-fg">Loading performance details…</p>
              <p className="text-xs text-stage-muted">
                Getting the latest information for this event.
              </p>
            </div>
          )}

          {/* Error Hero */}
          {!isLoading && error && (
            <div className="mt-8 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center max-w-xl">
              <IconAlert className="size-10 text-rose-500 mx-auto" />
              <h2 className="mt-4 font-serif text-2xl font-bold text-stage-fg">
                Performance Not Found
              </h2>
              <p className="mt-2 text-sm text-stage-muted">
                We couldn’t find that performance. It may have been moved or removed.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  to="/"
                  className="rounded-full bg-brass-bright px-5 py-2 text-xs font-bold text-night-950 shadow-md hover:bg-amber-300"
                >
                  Return to Home
                </Link>
                <Link
                  to="/performances"
                  className="rounded-full border border-stage-line-strong bg-stage-glass-strong px-5 py-2 text-xs font-bold text-stage-fg hover:bg-stage-hover"
                >
                  View All Performances
                </Link>
              </div>
            </div>
          )}

          {/* Loaded Performance Header */}
          {!isLoading && performance && (
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-stage-line-strong bg-stage-glass-strong px-3 py-1 text-xs font-bold uppercase tracking-wider text-tile-fg backdrop-blur-sm">
                  <IconSparkle className="size-3.5" />
                  Community Event
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeColor}`}
                >
                  {performance.event_type}
                </span>
              </div>

              <h1 className="mt-4 max-w-4xl font-serif text-3xl font-bold leading-tight tracking-tight text-balance text-stage-fg md:text-5xl">
                {performance.title}
              </h1>

              <p className="mt-3 text-base text-stage-muted md:text-lg">
                Conducted by <strong className="text-stage-fg">{performance.conductor}</strong> ·{" "}
                {performance.city}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main Details Body */}
      {!isLoading && performance && (
        <section className="band bg-paper">
          <div className="mx-auto w-full max-w-6xl px-5 py-12 md:py-16">
            <SampleNotice className="mb-8" />
            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
              {/* Left Column: Full Description & Overview */}
              <div className="space-y-8">
                {/* Description Card */}
                <div className="rounded-3xl border border-line bg-surface p-8 shadow-sm">
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-ink">
                    About This Performance
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-body md:text-lg">
                    {performance.description}
                  </p>
                  <div className="mt-6 border-t border-line/60 pt-6">
                    <h3 className="font-serif text-lg font-semibold text-ink">Concert Admission</h3>
                    <p className="mt-2 text-sm text-muted">
                      Admission to all Community Music Band performances is completely free of
                      charge. No tickets or reservations are required. Seating is general admission
                      on a first-come, first-served basis. Families with children of all ages are
                      warmly encouraged to attend.
                    </p>
                  </div>
                </div>

                {/* Event Schedule & Logistics Card */}
                <div className="rounded-3xl border border-line bg-surface p-8 shadow-sm">
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-ink">
                    Event Logistics & Program Information
                  </h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-line/50 bg-paper p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Duration
                      </span>
                      <p className="mt-1 font-serif text-xl font-bold text-ink">
                        {performance.duration_minutes} Minutes
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Includes intermission where applicable
                      </p>
                    </div>

                    <div className="rounded-2xl border border-line/50 bg-paper p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Event Category
                      </span>
                      <p className="mt-1 font-serif text-xl font-bold text-ink">
                        {performance.event_type}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">Community Music Band 2026 Series</p>
                    </div>

                    <div className="rounded-2xl border border-line/50 bg-paper p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Location
                      </span>
                      <p className="mt-1 font-serif text-xl font-bold text-ink">
                        {performance.city}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">Municipal Regional Area</p>
                    </div>

                    <div className="rounded-2xl border border-line/50 bg-paper p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Music Direction
                      </span>
                      <p className="mt-1 font-serif text-xl font-bold text-ink">
                        {performance.conductor}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">Principal Musical Conductor</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Details Sidebar & Support */}
              <div className="space-y-6">
                {/* At-a-Glance Box */}
                <div className="rounded-3xl border-2 border-brass/40 bg-surface p-7 shadow-lg">
                  <h3 className="font-serif text-xl font-bold text-ink">Performance Details</h3>

                  <div className="mt-6 space-y-5">
                    {/* Date */}
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border border-tile-line bg-tile text-ink">
                        <span className="font-serif text-base font-bold leading-none">
                          {dateParts?.day ?? ""}
                        </span>
                        <span className="mt-0.5 text-[0.6rem] font-extrabold uppercase tracking-widest text-tile-fg">
                          {dateParts?.month ?? ""}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">
                          Date
                        </p>
                        <p className="font-serif text-base font-semibold text-ink">
                          {performance.performance_date}
                        </p>
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="flex items-start gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-paper text-brass">
                        <IconMapPin className="size-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">
                          Venue
                        </p>
                        <p className="font-serif text-base font-semibold text-ink">
                          {performance.venue}
                        </p>
                        <p className="text-xs text-muted">{performance.city}</p>
                      </div>
                    </div>

                    {/* Conductor */}
                    <div className="flex items-start gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-paper text-brass">
                        <IconMusic className="size-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">
                          Conductor
                        </p>
                        <p className="font-serif text-base font-semibold text-ink">
                          {performance.conductor}
                        </p>
                      </div>
                    </div>

                    {/* Start time */}
                    <div className="flex items-start gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-paper text-brass">
                        <IconClock className="size-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">
                          Start Time
                        </p>
                        <p className="font-serif text-base font-semibold text-ink">
                          {formatTime(performance.start_time) || "To be announced"}
                        </p>
                        <p className="text-xs text-muted">
                          {performance.duration_minutes} minutes long
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action links */}
                  <div className="mt-8 space-y-3 pt-6 border-t border-line">
                    <Link
                      to="/"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brass-bright px-5 py-3 text-sm font-bold text-night-950 shadow-md transition-all hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                    >
                      <IconArrowLeft className="size-4" />
                      Back to Home
                    </Link>
                    <Link
                      to="/performances"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brass/40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                    >
                      Browse Full 2026 Schedule
                    </Link>
                  </div>
                </div>

                {/* Support Card */}
                <div className="rounded-3xl border border-line bg-feature p-6 text-feature-fg shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-brass/20 text-brass">
                      <IconHeart className="size-5" />
                    </span>
                    <h4 className="font-serif text-lg font-bold">Help Fund Free Music</h4>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-feature-muted">
                    We never charge admission to concerts or student lessons. Your donation directly
                    purchases sheet music and student loaner instruments.
                  </p>
                  <Link
                    to="/donate"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-brass-bright px-5 py-2.5 text-xs font-bold text-night-950 shadow transition-all hover:bg-amber-300"
                  >
                    Support This Event
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default DetailPage;
