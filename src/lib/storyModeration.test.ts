import { describe, expect, it } from "vitest";
import {
  canApproveStory,
  canRejectStory,
  canReopenStory,
  countStoriesByStatus,
  rejectionSummary,
} from "./storyModeration";

describe("story moderation transitions", () => {
  it("allows drafts and pending submissions to be approved", () => {
    expect(canApproveStory("draft")).toBe(true);
    expect(canApproveStory("pending")).toBe(true);
    expect(canApproveStory("approved")).toBe(false);
    expect(canApproveStory("rejected")).toBe(false);
  });

  it("allows only pending submissions to be rejected", () => {
    expect(canRejectStory("pending")).toBe(true);
    expect(canRejectStory("draft")).toBe(false);
    expect(canRejectStory("approved")).toBe(false);
    expect(canRejectStory("rejected")).toBe(false);
  });

  it("allows only rejected stories to be reopened", () => {
    expect(canReopenStory("rejected")).toBe(true);
    expect(canReopenStory("draft")).toBe(false);
    expect(canReopenStory("pending")).toBe(false);
    expect(canReopenStory("approved")).toBe(false);
  });

  it("appends an optional note to the stored rejection reason", () => {
    expect(rejectionSummary("Insufficient detail", "Add a date and place.")).toBe(
      "Insufficient detail: Add a date and place.",
    );
    expect(rejectionSummary("Spam", "   ")).toBe("Spam");
  });

  it("counts each status and the total", () => {
    expect(
      countStoriesByStatus([
        { status: "pending" },
        { status: "pending" },
        { status: "approved" },
        { status: "draft" },
        { status: "rejected" },
      ]),
    ).toEqual({
      all: 5,
      draft: 1,
      pending: 2,
      approved: 1,
      rejected: 1,
    });
  });
});
