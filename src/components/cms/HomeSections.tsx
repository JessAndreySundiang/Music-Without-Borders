import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import SheetMusic from "../SheetMusic";
import SectionHeading from "../SectionHeading";
import MetricCard from "../MetricCard";
import ProgramCard from "../ProgramCard";
import TestimonialCard from "../TestimonialCard";
import { InstrumentThumb } from "../InstrumentCard";
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconMapPin,
  IconMusic,
  IconSparkle,
  IconTicket,
} from "../Icons";
import { instruments } from "../../data/instruments";
import { eventDateParts, formatTime } from "../../lib/events";
import { resolveIcon } from "../../lib/iconMap";
import { ctaVariant, paragraphs, sectionItems } from "../../lib/section";
import type { CmsTestimonial, HomePageContent, PageSection } from "../../types/Cms";
import type { Performance } from "../../types/Performance";
import logo from "../../assets/logo.svg";
import SampleNotice from "./SampleNotice";
import SectionCta from "./SectionCta";
import SectionLink from "./SectionLink";

type SectionProps = {
  section: PageSection;
};

function SectionTitle({
  section,
  center = false,
  showText = true,
}: {
  section: PageSection;
  center?: boolean;
  showText?: boolean;
}) {
  return (
    <SectionHeading
      center={center}
      eyebrow={section.eyebrow ?? undefined}
      title={section.title ?? ""}
      text={showText ? (section.body ?? undefined) : undefined}
    />
  );
}

function HeroSection({
  section,
  nextPerformance,
}: SectionProps & { nextPerformance: Performance | null }) {
  const ctas = sectionItems(section, "cta");
  const trustPoints = sectionItems(section, "trust_point");
  const metrics = sectionItems(section, "metric");
  const nextDate = nextPerformance ? eventDateParts(nextPerformance.performance_date) : null;

  return (
    <section className="stage relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-1/4 size-[26rem] rounded-full bg-amber-400/10 blur-3xl motion-safe:animate-drift" />
        <div className="absolute -right-20 top-8 size-[22rem] rounded-full bg-plume/10 blur-3xl motion-safe:animate-float-slow" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div className="max-w-xl">
          {section.eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-widest text-tile-fg backdrop-blur-sm">
              <IconSparkle className="size-4" />
              {section.eyebrow}
            </span>
          )}

          <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl">
            <span className="bg-[linear-gradient(105deg,var(--title-from),var(--title-to))] bg-clip-text text-transparent">
              {section.title}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-stage-muted">{section.body}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {ctas.map((cta) => (
              <SectionCta
                key={cta.id}
                item={cta}
                context="stage"
                defaultIcon={
                  ctaVariant(cta) === "primary" ? (
                    <IconArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
                  ) : (
                    <IconTicket className="size-5" />
                  )
                }
              />
            ))}
            {ctas.length === 0 && (
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300"
              >
                Join a rehearsal
                <IconArrowRight className="size-5" />
              </Link>
            )}
          </div>

          {trustPoints.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stage-muted">
              {trustPoints.map((point) => (
                <li key={point.id} className="inline-flex items-center gap-2">
                  <IconCheck className="size-4 text-tile-fg" />
                  {point.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative aspect-square">
            <div className="absolute inset-0 rounded-full border border-stage-ring" />
            <div className="absolute inset-8 rounded-full border border-stage-line" />
            <div className="absolute inset-0 rounded-full border border-dashed border-stage-ring motion-safe:animate-spin-slow" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid size-40 place-items-center rounded-full border border-medal-ring bg-gradient-to-br from-medal-from to-medal-to shadow-[0_0_90px_-10px_var(--medal-glow)]">
                <img src={logo} alt="" className="size-20" />
              </span>
            </div>

            {nextPerformance && nextDate && (
              <div className="absolute -bottom-6 left-1/2 w-64 -translate-x-1/2 rounded-2xl border border-stage-line bg-stage-glass-strong p-4 text-left shadow-xl backdrop-blur-md motion-safe:animate-float">
                <Link to={`/detail/${nextPerformance.id}`} className="group/chip block">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.68rem] font-bold uppercase tracking-widest text-tile-fg">
                      Next concert
                    </p>
                    <span className="shrink-0 text-[0.65rem] font-semibold text-brass transition-transform group-hover/chip:translate-x-0.5">
                      Details →
                    </span>
                  </div>
                  <p className="mt-1 font-serif text-lg leading-tight text-stage-fg transition-colors group-hover/chip:text-brass">
                    {nextPerformance.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-stage-muted">
                    {nextDate.month} {nextDate.day} · {formatTime(nextPerformance.start_time)}
                    {nextPerformance.start_time ? " · " : ""}
                    {nextPerformance.venue}
                  </p>
                  <p className="mt-0.5 truncate text-[0.68rem] text-stage-muted/80">
                    Conducted by {nextPerformance.conductor}
                  </p>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_68%,transparent)] opacity-70 sm:h-56"
      >
        <SheetMusic className="h-full w-full" />
      </div>

      {metrics.length > 0 && (
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-20">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={{
                  id: String(metric.id),
                  value: metric.value ?? "",
                  label: metric.title ?? "",
                  icon: resolveIcon(metric.icon),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function MissionSection({ section }: SectionProps) {
  const feature = sectionItems(section, "feature_card")[0];

  return (
    <section className="band bg-paper">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionTitle section={section} showText={false} />
          <div className="mt-4 space-y-4 text-base leading-relaxed text-muted">
            {paragraphs(section.body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {feature && (
          <div className="relative overflow-hidden rounded-3xl border-l-[6px] border-plume bg-feature p-8 shadow-2xl">
            <img src={logo} alt="" className="size-12 rounded-full ring-1 ring-brass/40" />
            <p className="mt-4 font-serif text-2xl font-semibold leading-snug text-feature-fg">
              {feature.title}
            </p>
            {feature.body && <p className="mt-3 text-sm text-feature-muted">{feature.body}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

const featuredInstruments = ["trumpet", "clarinet", "flute", "drum-set"]
  .map((id) => instruments.find((instrument) => instrument.id === id))
  .filter((instrument): instrument is NonNullable<typeof instrument> => Boolean(instrument));

function ProgramsSection({ section }: SectionProps) {
  const programs = sectionItems(section, "program");

  return (
    <section className="band-tint bg-paper-2">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <SectionTitle section={section} center />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={{
                id: String(program.id),
                title: program.title ?? "",
                text: program.body ?? "",
                who: program.value ?? "",
                icon: resolveIcon(program.icon),
              }}
            />
          ))}
        </div>

        <div className="mt-14 overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-sm lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-10 lg:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-widest text-brass">
              <IconMusic className="size-4" />
              Our instrument family
            </span>
            <h3 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-balance text-ink">
              Every sound has a place.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              From a first flute to the biggest drum, students can try an instrument and borrow one
              from the band. Meet the instruments that fill our bandstand.
            </p>
            <SectionLink
              href="/instruments"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-brass-bright px-5 py-2.5 text-xs font-bold text-night-950 transition-all hover:-translate-y-0.5 hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
            >
              Explore the instrument gallery
              <IconArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </SectionLink>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-0">
            {featuredInstruments.map((instrument) => (
              <InstrumentThumb key={instrument.id} instrument={instrument} showName />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomePerformanceCard({ performance }: { performance: Performance }) {
  const parts = eventDateParts(performance.performance_date);

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all duration-300 hover:border-brass/60 hover:shadow-xl">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-tile-line bg-tile text-ink">
            <span className="font-serif text-xl font-semibold leading-none">
              {parts?.day ?? performance.performance_date}
            </span>
            <span className="mt-1 text-[0.65rem] font-bold uppercase tracking-wider text-tile-fg">
              {parts?.month ?? ""}
            </span>
          </div>
          <span className="rounded-full border border-brass/30 bg-brass/10 px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-brass">
            {performance.event_type}
          </span>
        </div>

        <h3 className="mt-4 font-serif text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-brass">
          {performance.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs text-muted">{performance.description}</p>

        <div className="mt-4 space-y-1.5 border-t border-line/50 pt-3 text-xs text-muted">
          <div className="flex items-center gap-1.5 truncate">
            <IconMapPin className="size-3.5 shrink-0 text-brass" />
            <span className="truncate">
              {performance.venue}, {performance.city}
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <IconMusic className="size-3.5 shrink-0 text-brass" />
            <span className="truncate">Conductor: {performance.conductor}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconClock className="size-3.5 shrink-0 text-brass" />
            <span>
              {formatTime(performance.start_time) || `${performance.duration_minutes} mins`}
              {performance.start_time ? ` · ${performance.duration_minutes} mins` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-line/40 pt-3">
        <Link
          to={`/detail/${performance.id}`}
          className="inline-flex w-full items-center justify-between rounded-xl bg-paper px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:bg-brass-bright hover:text-night-950"
        >
          <span>Performance Details</span>
          <IconArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

function EventsSection({ section }: SectionProps) {
  const records = (section.records as Performance[] | undefined) ?? [];
  const cta = sectionItems(section, "cta")[0];
  const notice = typeof section.extra.notice === "string" ? section.extra.notice : undefined;

  return (
    <section id="events" className="band scroll-mt-24 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle section={section} />
          {cta && <SectionCta item={cta} className="shrink-0" />}
        </div>

        <SampleNotice message={notice} className="mt-8" />

        {records.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {records.map((performance) => (
              <HomePerformanceCard key={performance.id} performance={performance} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <IconTicket className="mx-auto size-8 text-brass" />
            <p className="mt-3 font-serif text-xl font-semibold text-ink">
              The next season is being planned.
            </p>
            <p className="mt-1 text-sm text-muted">
              Check back soon for free concerts and community performances.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialsSection({ section }: SectionProps) {
  const records = (section.records as CmsTestimonial[] | undefined) ?? [];

  return (
    <section className="band-tint bg-paper-2">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <SectionTitle section={section} center />
        {records.length > 0 ? (
          <div className="mt-14 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={{
                  id: String(testimonial.id),
                  quote: testimonial.quote,
                  name: testimonial.name,
                  role: testimonial.role,
                  initials: testimonial.initials,
                  imageUrl: testimonial.image_url,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-sm text-muted">
            Stories from the band are coming soon.
          </p>
        )}
      </div>
    </section>
  );
}

function CtaSection({ section }: SectionProps) {
  const ctas = sectionItems(section, "cta");

  return (
    <section className="stage relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-24 left-1/4 size-[24rem] rounded-full bg-amber-400/10 blur-3xl" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-center md:justify-between md:py-24">
        <div className="max-w-xl">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-balance text-stage-fg md:text-4xl">
            {section.title}
          </h2>
          {section.body && <p className="mt-4 text-stage-muted">{section.body}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          {ctas.map((cta) => (
            <SectionCta key={cta.id} item={cta} context="stage" />
          ))}
        </div>
      </div>
    </section>
  );
}

const homeRegistry: Record<
  string,
  (props: SectionProps & { nextPerformance: Performance | null }) => ReactNode
> = {
  hero: HeroSection,
  mission: MissionSection,
  programs: ProgramsSection,
  events: EventsSection,
  testimonials: TestimonialsSection,
  cta: CtaSection,
};

export default function HomeSectionRenderer({ content }: { content: HomePageContent }) {
  return (
    <>
      {content.sections.map((section) => {
        const Component = homeRegistry[section.component];
        if (!Component) return null;

        return (
          <Component
            key={section.id}
            section={section}
            nextPerformance={content.next_performance}
          />
        );
      })}
    </>
  );
}
