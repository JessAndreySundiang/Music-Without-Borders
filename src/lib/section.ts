import type { PageSection, SectionItem } from "../types/Cms";

export function sectionItems(section: PageSection, ...types: string[]): SectionItem[] {
  if (types.length === 0) return section.items;
  return section.items.filter((item) => types.includes(item.item_type));
}

export function paragraphs(body: string | null | undefined): string[] {
  return (body ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function extraString(
  extra: Record<string, unknown> | undefined,
  key: string,
  fallback = "",
): string {
  const value = extra?.[key];
  return typeof value === "string" ? value : fallback;
}

export function extraNumber(
  extra: Record<string, unknown> | undefined,
  key: string,
  fallback = 0,
): number {
  const value = extra?.[key];
  return typeof value === "number" ? value : fallback;
}

export function itemExtraString(item: SectionItem, key: string, fallback = ""): string {
  return extraString(item.extra, key, fallback);
}

export function itemExtraNumber(item: SectionItem, key: string, fallback = 0): number {
  return extraNumber(item.extra, key, fallback);
}

export function isExternalLink(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Primary CTAs are brass; everything else is the quieter outline treatment. */
export function ctaVariant(item: SectionItem): "primary" | "secondary" {
  return itemExtraString(item, "variant") === "secondary" ? "secondary" : "primary";
}
