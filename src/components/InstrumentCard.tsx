import type { Instrument } from "../data/instruments";
import { instrumentImage } from "../data/instruments";
import { IconMusic } from "./Icons";

type InstrumentVisualProps = {
  instrument: Instrument;
  className?: string;
  eager?: boolean;
};

/** The image plate shared by the gallery card and the home-page strip. */
export function InstrumentVisual({ instrument, className = "", eager }: InstrumentVisualProps) {
  const src = instrumentImage(instrument.image);

  return (
    <div
      className={`relative isolate overflow-hidden rounded-2xl border border-line shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] ${className}`}
      style={{ background: instrument.mat }}
    >
      {src ? (
        <img
          src={src}
          alt={instrument.alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.035]"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-muted">
          <IconMusic className="size-12" />
        </span>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10"
      />
    </div>
  );
}

type InstrumentCardProps = {
  instrument: Instrument;
  eager?: boolean;
};

function InstrumentCard({ instrument, eager }: InstrumentCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-line bg-surface p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass/60 hover:shadow-xl">
      <InstrumentVisual instrument={instrument} className="aspect-[4/3]" eager={eager} />
      <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
            {instrument.name}
          </h3>
          <span className="mt-0.5 shrink-0 rounded-full bg-plume/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-plume">
            {instrument.level}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{instrument.description}</p>
      </div>
    </article>
  );
}

type InstrumentThumbProps = {
  instrument: Instrument;
  className?: string;
  showName?: boolean;
};

/** A lighter-weight tile for the home-page programme strip. */
export function InstrumentThumb({ instrument, className = "", showName }: InstrumentThumbProps) {
  return (
    <div className="group">
      <InstrumentVisual instrument={instrument} className={`aspect-square ${className}`} />
      {showName && (
        <p className="mt-2 text-center text-xs font-bold uppercase tracking-wider text-muted">
          {instrument.name}
        </p>
      )}
    </div>
  );
}

export default InstrumentCard;
