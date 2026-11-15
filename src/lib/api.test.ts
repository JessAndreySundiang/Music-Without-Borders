import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  fetchAboutPage,
  fetchHomePage,
  fetchPerformanceById,
  fetchPerformances,
  fetchSiteSettings,
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
});
