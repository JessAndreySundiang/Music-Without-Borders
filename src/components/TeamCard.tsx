import type { TeamMember } from "../data/team";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

function TeamCard({ member }: { member: TeamMember }) {
  const { name, role, image, imageAlt } = member;
  const initials = initialsFor(name);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition duration-300 hover:border-brass/50 hover:shadow-xl motion-safe:hover:-translate-y-1">
      <div className="relative aspect-4/5 overflow-hidden bg-tile">
        {image ? (
          <img
            src={image}
            alt={imageAlt ?? `Portrait of ${name}`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-center transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div
            role="img"
            aria-label={`Portrait placeholder for ${name}`}
            className="grid size-full place-items-center bg-gradient-to-br from-tile to-tile-2"
          >
            <span
              aria-hidden="true"
              className="font-serif text-6xl font-semibold tracking-tight text-tile-fg"
            >
              {initials}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight text-ink">
          {name}
        </h3>
        <div className="mt-3 flex items-center gap-2.5">
          <span aria-hidden="true" className="h-px w-6 shrink-0 bg-brass/50" />
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-brass">{role}</p>
        </div>
      </div>
    </article>
  );
}

export default TeamCard;
