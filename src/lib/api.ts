import type {
  AboutPageContent,
  AboutPageResponse,
  HomePageContent,
  HomePageResponse,
  SiteSettingsResponse,
} from "../types/Cms";
import type {
  Performance,
  PerformanceListResponse,
  PerformanceSingleResponse,
} from "../types/Performance";
import type {
  Story,
  StoryCategory,
  StoryListResponse,
  StorySingleResponse,
  StoryStatusInfo,
  StoryStatusLookupResponse,
} from "../types/Story";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export type StorySubmissionField =
  | "title"
  | "category"
  | "author_name"
  | "author_email"
  | "author_role"
  | "body"
  | "cover_image_url"
  | "consent"
  | "website";

export interface StorySubmissionInput {
  title: string;
  category?: StoryCategory;
  author_name: string;
  author_email: string;
  author_role?: string;
  body: string;
  cover_image_url?: string;
  consent: boolean;
  website?: string;
}

export class StorySubmissionError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "StorySubmissionError";
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, label: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${label} (HTTP ${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchPerformances(): Promise<Performance[]> {
  const json = await request<PerformanceListResponse>("/performances", "performances");
  return json.data;
}

export async function fetchPerformanceById(id: string | number): Promise<Performance> {
  const json = await request<PerformanceSingleResponse>(
    `/performances/${id}`,
    `performance #${id}`,
  );
  return json.data;
}

export async function fetchHomePage(): Promise<HomePageContent> {
  const json = await request<HomePageResponse>("/home", "the home page");
  return json.data;
}

export async function fetchAboutPage(): Promise<AboutPageContent> {
  const json = await request<AboutPageResponse>("/about", "the about page");
  return json.data;
}

export async function fetchSiteSettings(): Promise<Record<string, string>> {
  const json = await request<SiteSettingsResponse>("/settings", "site settings");
  return json.data;
}

export async function fetchStories(category?: string): Promise<Story[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const json = await request<StoryListResponse>(`/stories${query}`, "stories");
  return json.data;
}

export async function fetchStoryBySlug(slug: string): Promise<Story> {
  const json = await request<StorySingleResponse>(
    `/stories/${encodeURIComponent(slug)}`,
    `story "${slug}"`,
  );
  return json.data;
}

export async function fetchStoryStatus(referenceCode: string): Promise<StoryStatusInfo> {
  const json = await request<StoryStatusLookupResponse>(
    `/stories/status/${encodeURIComponent(referenceCode.trim())}`,
    `status for "${referenceCode}"`,
  );
  return json.data;
}

export async function submitStory(
  input: StorySubmissionInput,
): Promise<{ message: string; reference_code?: string }> {
  const response = await fetch(`${API_BASE_URL}/stories/submissions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    reference_code?: string;
    errors?: Record<string, string[]>;
  } | null;

  if (!response.ok) {
    throw new StorySubmissionError(
      payload?.message ?? `Unable to submit the story (HTTP ${response.status}).`,
      response.status,
      payload?.errors ?? {},
    );
  }

  return {
    message: payload?.message ?? "Thank you. Your story was received and is waiting for review.",
    reference_code: payload?.reference_code,
  };
}

export { API_BASE_URL };
