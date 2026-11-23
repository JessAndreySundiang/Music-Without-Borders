import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdminApiError,
  approveAdminStory,
  featureAdminStory,
  rejectAdminStory,
  reopenAdminStory,
  unfeatureAdminStory,
} from "./adminApi";
import type { AdminStory } from "../types/Admin";

const TOKEN_KEY = "mwb-admin-token";

function adminStory(overrides: Partial<AdminStory> = {}): AdminStory {
  return {
    id: 7,
    reference_code: "MWB-PLAZA001",
    title: "The Plaza Choir",
    slug: "the-plaza-choir",
    category: "community",
    excerpt: "A short excerpt.",
    body: "A story body.",
    author_name: "Mara Dela Cruz",
    author_email: "private@example.com",
    author_role: "Audience member",
    cover_image_path: null,
    cover_image_url: null,
    status: "pending",
    consent_at: "2026-11-20T10:00:00+08:00",
    reviewed_by: null,
    reviewer_name: null,
    reviewed_at: null,
    rejection_reason: null,
    is_sample: false,
    is_featured: false,
    published_at: null,
    sort_order: 0,
    created_at: "2026-11-20T10:00:00+08:00",
    updated_at: "2026-11-20T10:00:00+08:00",
    ...overrides,
  };
}

describe("admin story moderation client", () => {
  let store: Map<string, string>;
  let dispatchEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = new Map([[TOKEN_KEY, "test-token"]]);
    dispatchEvent = vi.fn();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
      dispatchEvent,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("approves a story with an authenticated POST", async () => {
    const approved = adminStory({ status: "approved", published_at: "2026-11-23" });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: approved }),
    } as unknown as Response);

    await expect(approveAdminStory(7)).resolves.toEqual(approved);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/stories/7/approve"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      }),
    );
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it("sends the rejection reason in the request body", async () => {
    const rejected = adminStory({
      status: "rejected",
      rejection_reason: "Insufficient detail",
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: rejected }),
    } as unknown as Response);

    await expect(rejectAdminStory(7, "Insufficient detail")).resolves.toEqual(rejected);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/stories/7/reject"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rejection_reason: "Insufficient detail" }),
      }),
    );
  });

  it("reopens a rejected story", async () => {
    const pending = adminStory({ status: "pending" });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: pending }),
    } as unknown as Response);

    await expect(reopenAdminStory(7)).resolves.toEqual(pending);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/stories/7/reopen"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("features an approved story", async () => {
    const featured = adminStory({ status: "approved", is_featured: true });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: featured }),
    } as unknown as Response);

    await expect(featureAdminStory(7)).resolves.toEqual(featured);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/stories/7/feature"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      }),
    );
  });

  it("unfeatures a story", async () => {
    const unfeatured = adminStory({ status: "approved", is_featured: false });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: unfeatured }),
    } as unknown as Response);

    await expect(unfeatureAdminStory(7)).resolves.toEqual(unfeatured);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/stories/7/unfeature"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      }),
    );
  });

  it("keeps validation errors from a failed moderation request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: "Only a pending submission can be rejected.",
        errors: { status: ["Only a pending submission can be rejected."] },
      }),
    } as unknown as Response);

    await expect(rejectAdminStory(7, "Spam")).rejects.toMatchObject({
      name: "AdminApiError",
      status: 422,
      errors: { status: ["Only a pending submission can be rejected."] },
    } satisfies Partial<AdminApiError>);
  });

  it("clears an expired token and emits the unauthorized event", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthenticated." }),
    } as unknown as Response);

    await expect(approveAdminStory(7)).rejects.toBeInstanceOf(AdminApiError);
    expect(store.has(TOKEN_KEY)).toBe(false);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });
});
