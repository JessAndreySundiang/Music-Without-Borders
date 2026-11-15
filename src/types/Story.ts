export interface Story {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  author_name: string | null;
  author_role: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  is_sample: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface StoryListResponse {
  data: Story[];
}

export interface StorySingleResponse {
  data: Story;
}
