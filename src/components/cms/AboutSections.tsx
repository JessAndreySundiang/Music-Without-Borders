import { useId, useState, type ReactNode } from "react";
import PageHero from "../PageHero";
import SectionHeading from "../SectionHeading";
import ProfileCard from "../ProfileCard";
import { resolveIcon } from "../../lib/iconMap";
import {
  extraString,
  itemExtraNumber,
  itemExtraString,
  paragraphs,
  sectionItems,
} from "../../lib/section";
import { useSiteSettings } from "../../lib/siteSettingsContext";
import type { AboutPageContent, PageSection } from "../../types/Cms";
import SectionCta from "./SectionCta";

type SectionProps = {
  section: PageSection;
};

function Heading({ section, center = false }: { section: PageSection; center?: boolean }) {
  return (
    <SectionHeading
      center={center}
      eyebrow={section.eyebrow ?? undefined}
      title={section.title ?? ""}
      text={section.body ?? undefined}
    />
  );
}

function HeroSection({ section }: SectionProps) {
  const ctas = sectionItems(section, "cta");

  return (
    <PageHero
      eyebrow={section.eyebrow ?? "About us"}
      title={section.title ?? ""}
      text={section.body ?? ""}
    >
      {ctas.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {ctas.map((cta) => (
            <SectionCta key={cta.id} item={cta} context="stage" />
          ))}
        </div>
      )}
    </PageHero>
  );
}

function ProfileSection({ section }: SectionProps) {
  const profile = sectionItems(section, "profile")[0];
  const { get } = useSiteSettings();

  if (!profile) return null;

  return (
    <section className="band bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
        <ProfileCard
          name={profile.title ?? ""}
          age={itemExtraNumber(profile, "age")}
          role={itemExtraString(profile, "role")}
          course={itemExtraString(profile, "course")}
          school={itemExtraString(profile, "school")}
          address={itemExtraString(profile, "address", get("contact.address"))}
          phone={get("contact.phone_label")}
          phoneHref={get("contact.phone_href")}
          instrument={itemExtraString(profile, "instrument")}
          bio={profile.body ?? undefined}
          imageUrl={profile.image_url}
        />
      </div>
    </section>
  );
}

function MissionSection({ section }: SectionProps) {
  const pillars = sectionItems(section, "pillar");

  return (
    <section className="band-tint bg-paper-2">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <SectionHeading center eyebrow={section.eyebrow ?? undefined} title={section.title ?? ""} />
        {section.body && (
          <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-muted">
            {section.body}
          </p>
        )}
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = resolveIcon(pillar.icon);
            return (
              <div
                key={pillar.id}
                className="rounded-2xl border border-line border-t-4 border-t-brass bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-brass/10 text-brass">
                  <Icon className="size-6" />
                </span>
                <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StoryTimelineSection({ section }: SectionProps) {
  const timeline = sectionItems(section, "timeline");

  return (
    <section className="band bg-paper">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeading eyebrow={section.eyebrow ?? undefined} title={section.title ?? ""} />
          <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">
            {paragraphs(section.body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <ol className="relative space-y-6 border-l-2 border-brass/40 pl-8">
          {timeline.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[2.65rem] top-1.5 size-3.5 rounded-full bg-brass shadow-[0_0_0_4px_var(--paper)]" />
              <p className="font-serif text-lg font-semibold text-ink">{item.value}</p>
              <p className="text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ValuesSection({ section }: SectionProps) {
  const values = sectionItems(section, "value");

  return (
    <section className="band-tint bg-paper-2">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <Heading section={section} center />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {values.map((value) => {
            const Icon = resolveIcon(value.icon);
            return (
              <div
                key={value.id}
                className="rounded-2xl border border-line border-t-4 border-t-plume bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-plume/10 text-plume">
                  <Icon className="size-6" />
                </span>
                <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{value.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ImpactSection({ section }: SectionProps) {
  const stats = sectionItems(section, "stat");

  return (
    <section className="band bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <Heading section={section} center />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = resolveIcon(stat.icon);
            return (
              <div
                key={stat.id}
                className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brass/10 text-brass">
                  <Icon className="size-6" />
                </span>
                <div>
                  <p className="font-serif text-3xl font-bold tracking-tight text-ink">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{stat.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="py-5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="font-serif text-lg font-semibold text-ink">{question}</span>
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M12 6v12M6 12h12" />
          </svg>
        </span>
      </button>
      <div
        id={panelId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="pt-3 text-base leading-relaxed text-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function FaqSection({ section }: SectionProps) {
  const faqs = sectionItems(section, "faq");

  return (
    <section className="band-tint bg-paper-2">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <Heading section={section} center />
        <div className="mx-auto mt-14 max-w-3xl divide-y divide-line">
          {faqs.map((item) => (
            <FaqAccordionItem key={item.id} question={item.title ?? ""} answer={item.body ?? ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

function JoinSection({ section }: SectionProps) {
  const details = sectionItems(section, "detail");
  const { get } = useSiteSettings();
  const ctaLabel = extraString(section.extra, "cta_label", "Call");
  const phoneLabel = get("contact.phone_label");
  const phoneHref = get("contact.phone_href");

  return (
    <section id="join" className="band scroll-mt-24 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <SectionHeading
          eyebrow={section.eyebrow ?? undefined}
          title={section.title ?? ""}
          text={section.body ?? undefined}
        />
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {details.map((item) => {
            const Icon = resolveIcon(item.icon);
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
              >
                <dt className="flex items-center gap-2 font-bold text-ink">
                  <Icon className="size-5 text-brass" />
                  {item.title}
                </dt>
                <dd className="mt-1 text-sm text-muted">{item.body}</dd>
              </div>
            );
          })}
        </dl>
        {phoneLabel && (
          <a
            href={phoneHref}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0"
          >
            {ctaLabel} {phoneLabel}
          </a>
        )}
      </div>
    </section>
  );
}

const aboutRegistry: Record<string, (props: SectionProps) => ReactNode> = {
  page_hero: HeroSection,
  profile: ProfileSection,
  mission: MissionSection,
  story_timeline: StoryTimelineSection,
  values: ValuesSection,
  impact: ImpactSection,
  faq: FaqSection,
  join: JoinSection,
};

export default function AboutSectionRenderer({ content }: { content: AboutPageContent }) {
  return (
    <>
      {content.sections.map((section) => {
        const Component = aboutRegistry[section.component];
        if (!Component) return null;
        return <Component key={section.id} section={section} />;
      })}
    </>
  );
}
