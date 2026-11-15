import { createElement, type ReactNode } from "react";
import { resolveIcon } from "../../lib/iconMap";
import { ctaVariant } from "../../lib/section";
import type { SectionItem } from "../../types/Cms";
import SectionLink from "./SectionLink";

const stagePrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 text-sm font-bold text-night-950 shadow-lg shadow-amber-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright";

const stageSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-stage-line-strong bg-stage-glass px-6 py-3.5 text-sm font-bold text-stage-fg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/60 hover:bg-stage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright";

const lightPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 text-sm font-bold text-night-950 shadow-lg shadow-amber-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright";

const lightSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 py-3.5 text-sm font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/60 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright";

type SectionCtaProps = {
  item: SectionItem;
  context?: "stage" | "light";
  defaultIcon?: ReactNode;
  className?: string;
};

function SectionCta({ item, context = "light", defaultIcon, className = "" }: SectionCtaProps) {
  const variant = ctaVariant(item);
  const Icon = item.icon ? resolveIcon(item.icon) : null;
  const classes =
    context === "stage"
      ? variant === "primary"
        ? stagePrimary
        : stageSecondary
      : variant === "primary"
        ? lightPrimary
        : lightSecondary;

  return (
    <SectionLink href={item.link_url || "/"} className={`group ${classes} ${className}`}>
      {item.link_label || item.title || "Learn more"}
      {Icon ? createElement(Icon, { className: "size-4.5" }) : defaultIcon}
    </SectionLink>
  );
}

export default SectionCta;
