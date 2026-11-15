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
import type { Story, StoryListResponse, StorySingleResponse } from "../types/Story";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

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

export async function fetchStories(): Promise<Story[]> {
  const json = await request<StoryListResponse>("/stories", "stories");
  return json.data;
}

export async function fetchStoryBySlug(slug: string): Promise<Story> {
  const json = await request<StorySingleResponse>(
    `/stories/${encodeURIComponent(slug)}`,
    `story "${slug}"`,
  );
  return json.data;
}

export { API_BASE_URL };
