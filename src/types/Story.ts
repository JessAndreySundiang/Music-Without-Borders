export type StoryCategory = "community" | "concert" | "rehearsal" | "lending-library";

export interface Story {
  id: number;
  title: string;
  slug: string;
  category: StoryCategory;
  excerpt: string | null;
  body: string;
  author_name: string | null;
  author_role: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
  is_sample: boolean;
  is_featured: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface StoryStatusInfo {
  reference_code: string;
  title: string;
  status: "draft" | "pending" | "approved" | "rejected";
  category: StoryCategory;
  submitted_at: string | null;
  published_at: string | null;
  rejection_reason: string | null;
}

export interface StoryStatusLookupResponse {
  data: StoryStatusInfo;
}

export interface StoryListResponse {
  data: Story[];
  meta?: {
    categories?: StoryCategory[];
  };
}

export interface StorySingleResponse {
  data: Story;
}
