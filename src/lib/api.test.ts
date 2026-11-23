import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  fetchAboutPage,
  fetchHomePage,
  fetchPerformanceById,
  fetchPerformances,
  fetchSiteSettings,
  fetchStories,
  fetchStoryStatus,
  StorySubmissionError,
  submitStory,
} from "./api";

const mockPerformances = [
  {
    id: 1,
    title: "Spring Wind Symphony Gala",
    performance_date: "2026-04-18",
    start_time: "16:00",
    event_type: "Concert",
    venue: "Civic Center Auditorium",
    city: "Springfield",
    duration_minutes: 90,
    conductor: "Elena Martinez",
    description: "Full wind ensemble program.",
  },
];

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetchPerformances returns parsed performance list from data envelope", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockPerformances }),
    } as unknown as Response);

    const result = await fetchPerformances();
    expect(result).toEqual(mockPerformances);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/performances"),
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("fetchPerformances throws error when response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(fetchPerformances()).rejects.toThrow("Failed to fetch performances (HTTP 500)");
  });

  it("fetchPerformanceById returns single performance", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockPerformances[0] }),
    } as unknown as Response);

    const result = await fetchPerformanceById(1);
    expect(result).toEqual(mockPerformances[0]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/performances/1"),
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("fetchPerformanceById throws error when performance is not found", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(fetchPerformanceById(999)).rejects.toThrow(
      "Failed to fetch performance #999 (HTTP 404)",
    );
  });

  it("fetchHomePage returns sections and the server-side next performance", async () => {
    const payload = {
      page: "home",
      sections: [
        {
          id: 1,
          key: "hero",
          component: "hero",
          eyebrow: "A volunteer band",
          title: "Music that belongs to everyone",
          body: "Free to learn.",
          extra: {},
          sort_order: 1,
          is_visible: true,
          items: [],
        },
      ],
      next_performance: mockPerformances[0],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: payload }),
    } as unknown as Response);

    await expect(fetchHomePage()).resolves.toEqual(payload);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/home"),
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("fetchAboutPage returns its ordered sections", async () => {
    const payload = { page: "about", sections: [] };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: payload }),
    } as unknown as Response);

    await expect(fetchAboutPage()).resolves.toEqual(payload);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/about"),
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("fetchSiteSettings returns the flat settings map", async () => {
    const settings = { "site.name": "Music Without Borders" };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: settings }),
    } as unknown as Response);

    await expect(fetchSiteSettings()).resolves.toEqual(settings);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/settings"),
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("submitStory posts the public payload and returns the review message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ message: "Thank you. Your story was received." }),
    } as unknown as Response);

    const input = {
      title: "A Saturday at the Plaza",
      author_name: "Mara Dela Cruz",
      author_email: "mara@example.com",
      body: "A story body.",
      consent: true,
      website: "",
    };

    await expect(submitStory(input)).resolves.toEqual({
      message: "Thank you. Your story was received.",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/stories/submissions"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("submitStory surfaces validation errors without dropping them", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: "The given data was invalid.",
        errors: { body: ["The body field is required."] },
      }),
    } as unknown as Response);

    await expect(
      submitStory({
        title: "A Saturday at the Plaza",
        author_name: "Mara Dela Cruz",
        author_email: "mara@example.com",
        body: "",
        consent: true,
      }),
    ).rejects.toMatchObject({
      name: "StorySubmissionError",
      status: 422,
      errors: { body: ["The body field is required."] },
    } satisfies Partial<StorySubmissionError>);
  });

  it("submitStory sends optional cover_image_url in the payload", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ message: "Thank you. Your story was received." }),
    } as unknown as Response);

    const input = {
      title: "A Saturday at the Plaza",
      author_name: "Mara Dela Cruz",
      author_email: "mara@example.com",
      body: "A story body.",
      cover_image_url: "https://example.com/cover.jpg",
      consent: true,
    };

    await expect(submitStory(input)).resolves.toEqual({
      message: "Thank you. Your story was received.",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/stories/submissions"),
      expect.objectContaining({
        body: JSON.stringify(input),
      }),
    );
  });

  it("fetchStories appends category query param when provided", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    } as unknown as Response);

    await fetchStories("concert");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/stories?category=concert"),
      expect.anything(),
    );
  });

  it("fetchStoryStatus queries the public status endpoint", async () => {
    const statusData = {
      reference_code: "MWB-12345678",
      title: "Plaza Story",
      status: "pending",
      category: "community",
      submitted_at: "2026-11-20T10:00:00+08:00",
      published_at: null,
      rejection_reason: null,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: statusData }),
    } as unknown as Response);

    const result = await fetchStoryStatus("MWB-12345678");
    expect(result).toEqual(statusData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/stories/status/MWB-12345678"),
      expect.anything(),
    );
  });
});
