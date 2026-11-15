import type { CmsTestimonial, HomePageContent, PageSection, SectionItem } from "./Cms";
import type { Performance } from "./Performance";
import type { Story } from "./Story";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
}

export interface AdminPerformance extends Performance {
  is_published: boolean;
}

export interface AdminTestimonial extends CmsTestimonial {
  is_published: boolean;
}

export type AdminStory = Story;

export interface SectionUpdate {
  eyebrow?: string | null;
  title?: string | null;
  body?: string | null;
  extra?: Record<string, unknown>;
  is_visible?: boolean;
  sort_order?: number;
}

export type ItemUpdate = Partial<
  Pick<
    SectionItem,
    | "title"
    | "body"
    | "value"
    | "icon"
    | "link_label"
    | "link_url"
    | "image_path"
    | "extra"
    | "is_visible"
    | "sort_order"
  >
>;

export type PageKey = "home" | "about";

export interface AdminPageContent extends HomePageContent {
  sections: PageSection[];
}

export type PerformanceDraft = Omit<AdminPerformance, "id">;
export type TestimonialDraft = Omit<AdminTestimonial, "id" | "initials" | "image_url">;
export type StoryDraft = Omit<
  AdminStory,
  "id" | "cover_image_url" | "published_at" | "created_at" | "updated_at"
>;

export interface AdminLoginResponse {
  data: AdminSession;
}

export interface AdminMeResponse {
  data: AdminUser;
}

export interface AdminPageResponse {
  data: AdminPageContent;
}

export interface AdminSettingsResponse {
  data: Record<string, string>;
}
