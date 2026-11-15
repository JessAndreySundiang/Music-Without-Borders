import type { Performance } from "./Performance";

export type SectionExtra = Record<string, unknown>;

export interface SectionItem {
  id: number;
  item_type: string;
  title: string | null;
  body: string | null;
  value: string | null;
  icon: string | null;
  link_label: string | null;
  link_url: string | null;
  image_path: string | null;
  image_url: string | null;
  extra: SectionExtra;
  sort_order: number;
  is_visible: boolean;
}

export interface CmsTestimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  initials: string;
  image_path: string | null;
  image_url: string | null;
  sort_order: number;
  is_published?: boolean;
}

export interface PageSection {
  id: number;
  key: string;
  component: string;
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  extra: SectionExtra;
  sort_order: number;
  is_visible: boolean;
  items: SectionItem[];
  /** Present only on the home page's events and testimonials sections. */
  records?: Performance[] | CmsTestimonial[];
}

export interface HomePageContent {
  page: "home";
  sections: PageSection[];
  next_performance: Performance | null;
}

export interface AboutPageContent {
  page: "about";
  sections: PageSection[];
}

export interface HomePageResponse {
  data: HomePageContent;
}

export interface AboutPageResponse {
  data: AboutPageContent;
}

export interface SiteSettingsResponse {
  data: Record<string, string>;
}
