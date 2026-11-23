import type { StoryStatus, StoryStatusCounts } from "../types/Admin";

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export const REJECTION_REASONS = [
  "Off-topic",
  "Inappropriate content",
  "Insufficient detail",
  "Privacy concern",
  "Spam",
  "Other",
] as const;

/** Mirrors the transitions allowed by `AdminStoryController`. */
export function canApproveStory(status: StoryStatus): boolean {
  return status === "draft" || status === "pending";
}

export function canRejectStory(status: StoryStatus): boolean {
  return status === "pending";
}

export function canReopenStory(status: StoryStatus): boolean {
  return status === "rejected";
}

/** The admin API stores one reason string; an optional note is appended. */
export function rejectionSummary(reason: string, note: string): string {
  const trimmed = note.trim();
  return trimmed ? `${reason}: ${trimmed}` : reason;
}

export function countStoriesByStatus(stories: Array<{ status: StoryStatus }>): StoryStatusCounts {
  const counts: StoryStatusCounts = {
    all: stories.length,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  stories.forEach((story) => {
    counts[story.status] += 1;
  });

  return counts;
}
