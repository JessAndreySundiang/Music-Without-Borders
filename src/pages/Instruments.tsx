import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import InstrumentCard from "../components/InstrumentCard";
import {
  IconArrowRight,
  IconHeart,
  IconInfo,
  IconInstrument,
  IconUsers,
} from "../components/Icons";
import { instrumentFamilies, instrumentsForFamily } from "../data/instruments";
import { usePageMeta } from "../lib/usePageTitle";

const lendingSteps = [
  {
    title: "Donate or lend",
    text: "A neighbour, alum, or local business passes on an instrument that is no longer being played.",
    Icon: IconHeart,
  },
  {
    title: "We repair and match",
    text: "Volunteers clean, repair, and match each instrument to a student who needs it.",
    Icon: IconInstrument,
  },
  {
    title: "A student takes it home",
    text: "The loan is free for as long as the student is learning and playing with the band.",
    Icon: IconUsers,
  },
];

function Instruments() {
  usePageMeta({
    page: "instruments",
    fallbackTitle: "Instruments",
    fallbackDescription:
      "Meet the woodwind, brass, string, and percussion instruments in the Music Without Borders' free lending library.",
  });

  return (
    <>
      <PageHero
        eyebrow="Instrument gallery"
        title="Meet the instruments behind the music."
        text="Every family of instruments has a place in our band. Explore the sounds our students learn, borrow, and perform with — from a first flute to the biggest drum."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/about#join"
            className="inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg"
          >
            Join a rehearsal
            <IconArrowRight className="size-5" />
          </Link>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-6 py-3.5 font-semibold text-stage-fg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/50 hover:bg-stage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg"
          >
            <IconHeart className="size-5" />
            Support the lending library
          </Link>
        </div>
      </PageHero>

      <section className="band bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <SectionHeading
              eyebrow="Four families, one band"
              title="A seat — and an instrument — for every curious player."
              text="You do not need to own an instrument to join. Our lending library and volunteer teachers make it possible to start from zero, whatever your age."
            />
            <nav aria-label="Instrument families" className="flex flex-wrap gap-2 lg:justify-end">
              {instrumentFamilies.map((family) => (
                <a
                  key={family.id}
                  href={`#${family.id}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-xs font-bold text-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/60 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                >
                  {family.name}
                  <span className="rounded-full bg-paper px-2 py-0.5 text-[0.65rem] text-muted">
                    {instrumentsForFamily(family.id).length}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {instrumentFamilies.map((family, familyIndex) => {
        const familyInstruments = instrumentsForFamily(family.id);
        const background = familyIndex % 2 === 0 ? "bg-paper-2" : "bg-paper";

        return (
          <section key={family.id} id={family.id} className={`band scroll-mt-24 ${background}`}>
            <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
              <SectionHeading
                eyebrow={`${familyInstruments.length} instruments`}
                title={family.name}
                text={family.blurb}
              />
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {familyInstruments.map((instrument, index) => (
                  <InstrumentCard
                    key={instrument.id}
                    instrument={instrument}
                    eager={familyIndex === 0 && index < 3}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="band-tint bg-paper-2">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
          <SectionHeading
            center
            eyebrow="The lending library"
            title="How an instrument finds its next player."
            text="The band owns more than 60 instruments, and every one of them is maintained for free student loans. Here is the journey from a dusty case to a first rehearsal."
          />

          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {lendingSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-3xl border border-line bg-surface p-7 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brass/10 text-brass">
                    <step.Icon className="size-6" />
                  </span>
                  <span className="font-serif text-3xl font-semibold text-line">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-xl font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-3.5 text-sm leading-relaxed text-muted">
            <IconInfo className="mt-0.5 size-4.5 shrink-0 text-brass" />
            <p>
              Instrument photographs are used for illustration. The exact make and model in our
              lending library changes as instruments are donated and repaired.
            </p>
          </div>
        </div>
      </section>

      <section className="stage relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -bottom-24 right-1/4 size-[24rem] rounded-full bg-amber-400/10 blur-3xl" />
        </div>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-center md:justify-between md:py-24">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-balance text-stage-fg md:text-4xl">
              The next instrument could change someone's year.
            </h2>
            <p className="mt-4 text-stage-muted">
              Play with us, borrow an instrument, or help us repair the next donation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/about#join"
              className="inline-flex items-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass-strong px-6 py-3.5 font-semibold text-stage-fg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/50 hover:bg-stage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg"
            >
              Join a rehearsal
            </Link>
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-fg"
            >
              <IconHeart className="size-5" />
              Donate an instrument
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Instruments;
