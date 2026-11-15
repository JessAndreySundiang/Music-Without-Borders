import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import {
  IconClock,
  IconMapPin,
  IconMusic,
  IconArrowRight,
  IconSpinner,
  IconAlert,
  IconTicket,
} from "../components/Icons";
import SampleNotice from "../components/cms/SampleNotice";
import { fetchPerformances } from "../lib/api";
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

export function IndexPage() {
  usePageMeta({
    page: "performances",
    fallbackTitle: "2026 Concert Season & Performances",
    fallbackDescription:
      "All Music Without Borders concerts and outreach events are free and open to everyone.",
  });

  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPerformances();
      setPerformances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load performances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Load once on mount. Keeping the initial state in `useState` means the
    // effect never has to set state synchronously before the request starts.
    fetchPerformances()
      .then((data) => {
        if (!cancelled) {
          setPerformances(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load performances");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    performances.forEach((p) => {
      if (p.event_type) types.add(p.event_type);
    });
    return ["All", ...Array.from(types)];
  }, [performances]);

  const filteredPerformances = useMemo(() => {
    return performances.filter((p) => {
      const matchesType = selectedType === "All" || p.event_type === selectedType;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.venue.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.conductor.toLowerCase().includes(query) ||
        p.event_type.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [performances, selectedType, searchQuery]);

  return (
    <>
      <PageHero
        eyebrow="2026 Concert Season"
        title="Live Performances & Rehearsal Schedule"
        text="All Music Without Borders concerts and outreach events are free and open to everyone. Bring a friend, a chair, and your love of music."
      />

      <section className="band bg-paper min-h-[60vh]">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 md:py-16">
          <SampleNotice className="mb-8" />

          {/* Controls: Search and Event Type Filters */}
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1">
                Filter:
              </span>
              {eventTypes.map((type) => {
                const isActive = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright ${
                      isActive
                        ? "bg-brass-bright text-night-950 shadow-sm"
                        : "border border-line bg-surface text-muted hover:border-brass/40 hover:text-ink"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* Search input */}
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search events, cities, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <IconSpinner className="size-10 animate-spin text-brass" />
              <p className="mt-4 font-serif text-lg font-medium text-ink">
                Loading the performance schedule…
              </p>
              <p className="text-sm text-muted">This will only take a moment.</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center max-w-xl mx-auto">
              <IconAlert className="size-10 text-rose-500 mx-auto" />
              <h3 className="mt-4 font-serif text-xl font-semibold text-ink">
                We Couldn’t Load the Schedule
              </h3>
              <p className="mt-2 text-sm text-muted">
                Please check your connection and try again. If the problem continues, come back a
                little later.
              </p>
              <button
                type="button"
                onClick={loadData}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-2.5 text-sm font-bold text-night-950 shadow-md transition-all hover:bg-amber-300"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredPerformances.length === 0 && (
            <div className="rounded-3xl border border-line bg-surface p-12 text-center max-w-md mx-auto">
              <IconTicket className="size-12 text-brass mx-auto opacity-70" />
              <h3 className="mt-4 font-serif text-xl font-semibold text-ink">
                No Performances Found
              </h3>
              <p className="mt-2 text-sm text-muted">
                No performances match your current filter or search criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("All");
                  setSearchQuery("");
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink hover:border-brass/40"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Performance Grid */}
          {!loading && !error && filteredPerformances.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPerformances.map((perf) => {
                const dateParts = eventDateParts(perf.performance_date);
                const badgeColor =
                  eventTypeColors[perf.event_type] || "border-line bg-surface text-muted";

                return (
                  <article
                    key={perf.id}
                    className="group flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass/50 hover:shadow-xl"
                  >
                    <div>
                      {/* Top Bar: Date & Event Type Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-tile-line bg-tile text-ink shadow-sm">
                          <span className="font-serif text-xl font-bold leading-none">
                            {dateParts?.day ?? perf.performance_date}
                          </span>
                          <span className="mt-1 text-[0.65rem] font-extrabold uppercase tracking-widest text-tile-fg">
                            {dateParts?.month ?? ""}
                          </span>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider ${badgeColor}`}
                        >
                          {perf.event_type}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mt-5 font-serif text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-brass">
                        {perf.title}
                      </h3>

                      {/* Description Snippet */}
                      <p className="mt-2.5 text-sm leading-relaxed text-muted line-clamp-2">
                        {perf.description}
                      </p>

                      {/* Metadata Chips */}
                      <div className="mt-5 space-y-2 border-t border-line/50 pt-4 text-xs text-muted">
                        <div className="flex items-center gap-2">
                          <IconMapPin className="size-4 shrink-0 text-brass" />
                          <span className="truncate">
                            {perf.venue}, {perf.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconMusic className="size-4 shrink-0 text-brass" />
                          <span className="truncate">Conductor: {perf.conductor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconClock className="size-4 shrink-0 text-brass" />
                          <span>
                            {formatTime(perf.start_time) ? `${formatTime(perf.start_time)} · ` : ""}
                            {perf.duration_minutes} minutes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action: Link to Detail */}
                    <div className="mt-6 pt-4 border-t border-line/40">
                      <Link
                        to={`/detail/${perf.id}`}
                        className="group/link inline-flex w-full items-center justify-between rounded-xl bg-paper px-4 py-2.5 text-xs font-bold text-ink transition-colors hover:bg-brass-bright hover:text-night-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                      >
                        <span>View Performance Details</span>
                        <IconArrowRight className="size-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default IndexPage;
