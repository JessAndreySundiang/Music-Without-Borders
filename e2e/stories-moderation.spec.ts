import { expect, test, type Page } from "@playwright/test";
import {
  createE2eAdmin,
  expectNoA11yViolations,
  resetE2eCache,
  signInAsAdmin,
  trackPageErrors,
} from "./helpers";

const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueTitle(label: string): string {
  return `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function storyCard(page: Page, title: string) {
  return page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { level: 3, name: title, exact: true }) });
}

function statusFilter(page: Page, status: string) {
  return page
    .getByRole("group", { name: "Filter stories by moderation status" })
    .getByRole("button", { name: new RegExp(`^${status}`) });
}

async function submitStory(
  page: Page,
  title: string,
  options?: { coverImageUrl?: string; category?: string },
): Promise<string> {
  await page.goto("/stories/submit");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Every good story starts with someone listening/i,
    }),
  ).toBeVisible();
  await expectNoA11yViolations(page);

  await page.locator("#story-author-name").fill("E2E Reader");
  await page.locator("#story-author-email").fill("e2e-reader@example.com");
  await page.locator("#story-author-role").fill("Audience member");
  if (options?.category) {
    await page.locator("#story-category").selectOption(options.category);
  }
  if (options?.coverImageUrl) {
    await page.locator("#story-cover-image-url").fill(options.coverImageUrl);
  }
  await page.locator("#story-title").fill(title);
  await page
    .locator("#story-body")
    .fill(
      "The plaza filled with neighbors, folding chairs, and borrowed instruments. " +
        "A child handed out song sheets while the band tuned up. " +
        "When the chorus began, people who had never met sang the same line together. " +
        "It was a small evening, but it felt like the whole street had found its voice. ".repeat(2),
    );
  await page.locator("#story-consent").check();
  await page.getByRole("button", { name: "Submit for review" }).click();

  await expect(
    page.getByRole("heading", { level: 2, name: "Your story is pending review" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("waiting for review");

  const refCodeEl = page.getByTestId("reference-code-display");
  await expect(refCodeEl).toBeVisible();
  const refCode = (await refCodeEl.textContent())?.trim() ?? "";
  expect(refCode).toMatch(/^MWB-[A-Z0-9]{8}$/);
  return refCode;
}

async function openModerationQueue(page: Page, admin: ReturnType<typeof createE2eAdmin>) {
  await signInAsAdmin(page, admin);
  await page.goto("/admin?tab=stories");
  await expect(page.getByRole("heading", { level: 1, name: "Stories" })).toBeVisible();
}

test.describe("reader story moderation", () => {
  test.beforeEach(async () => {
    resetE2eCache();
  });

  test("a submitted story can be approved and becomes public", async ({ page }) => {
    const errors = trackPageErrors(page);
    const title = uniqueTitle("E2E Approved Story");
    const coverUrl = "https://images.example.com/plaza.jpg";

    await submitStory(page, title, { coverImageUrl: coverUrl });
    await expectNoA11yViolations(page);

    const admin = createE2eAdmin();
    await openModerationQueue(page, admin);

    const pendingCard = storyCard(page, title);
    await expect(pendingCard).toBeVisible();
    await expect(page.getByText("waiting for review")).toBeVisible();
    await expectNoA11yViolations(page);

    await pendingCard.getByRole("button", { name: `Preview ${title}` }).click();
    const preview = page.getByRole("dialog");
    await expect(preview.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(preview.getByText("e2e-reader@example.com")).toBeVisible();
    await expect(preview.locator(`img[src="${coverUrl}"]`)).toBeAttached();
    await expect(preview.getByText(/Moderation audit trail/i)).toBeVisible();
    await expect(preview.locator("ol").getByText("submitted", { exact: true })).toBeVisible();
    await preview.getByRole("button", { name: "Close preview" }).click();
    await expect(preview).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.accept());
    await pendingCard.getByRole("button", { name: `Approve ${title}` }).click();
    await expect(page.getByText(/It is now public\./)).toBeVisible();

    await statusFilter(page, "Approved").click();
    const approvedCard = storyCard(page, title);
    await expect(approvedCard).toBeVisible();

    const href = await approvedCard
      .getByRole("link", { name: `View public story ${title}` })
      .getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(href!);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("E2E Reader", { exact: true })).toBeVisible();
    await expect(page.locator(`img[src="${coverUrl}"]`)).toBeAttached();
    await expect(page.getByText("Sample story", { exact: true })).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("a rejected story requires a reason and stays private", async ({ page }) => {
    const errors = trackPageErrors(page);
    const title = uniqueTitle("E2E Rejected Story");

    await submitStory(page, title);

    const admin = createE2eAdmin();
    await openModerationQueue(page, admin);

    const pendingCard = storyCard(page, title);
    await expect(pendingCard).toBeVisible();
    await pendingCard.getByRole("button", { name: `Reject ${title}` }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.locator("#reject-reason").selectOption("Insufficient detail");
    await page.locator("#reject-note").fill("Add a date and place for the event.");
    await dialog.getByRole("button", { name: "Reject story" }).click();

    await expect(page.getByText(/The story stays private\./)).toBeVisible();

    await statusFilter(page, "Rejected").click();
    const rejectedCard = storyCard(page, title);
    await expect(rejectedCard).toBeVisible();
    await expect(rejectedCard).toContainText(
      "Insufficient detail: Add a date and place for the event.",
    );

    await rejectedCard.getByRole("button", { name: `Preview ${title}` }).click();
    const rejectedPreview = page.getByRole("dialog");
    await expect(rejectedPreview.getByText(/Moderation audit trail/i)).toBeVisible();
    await expect(
      rejectedPreview.locator("ol").getByText("rejected", { exact: true }),
    ).toBeVisible();
    await expect(
      rejectedPreview.getByText(
        /Reason: Insufficient detail: Add a date and place for the event\./i,
      ),
    ).toBeVisible();
    await rejectedPreview.getByRole("button", { name: "Close preview" }).click();

    await page.goto(`/stories/${slugFromTitle(title)}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "That story could not be found" }),
    ).toBeVisible();

    const response = await page.request.get(`${API_URL}/api/stories`);
    expect(response.ok()).toBeTruthy();
    const publicList = (await response.json()) as { data: Array<{ title: string }> };
    expect(publicList.data.map((story) => story.title)).not.toContain(title);

    expect(errors).toEqual([]);
  });

  test("an approved story can be featured and is highlighted in the featured section", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const title = uniqueTitle("E2E Featured Story");

    await submitStory(page, title);

    const admin = createE2eAdmin();
    await openModerationQueue(page, admin);

    const pendingCard = storyCard(page, title);
    page.once("dialog", (dialog) => dialog.accept());
    await pendingCard.getByRole("button", { name: `Approve ${title}` }).click();
    await expect(page.getByText(/It is now public\./)).toBeVisible();

    await statusFilter(page, "Approved").click();
    const approvedCard = storyCard(page, title);
    await expect(approvedCard).toBeVisible();

    // Feature the approved story
    await approvedCard.getByRole("button", { name: `Feature ${title}` }).click();
    await expect(page.getByText(/It is now highlighted on the Stories page\./)).toBeVisible();
    await expect(approvedCard.getByText("Featured", { exact: true })).toBeVisible();

    // Check public /stories page
    await page.goto("/stories");
    const featuredSection = page.getByTestId("featured-story");
    await expect(featuredSection).toBeVisible();
    await expect(featuredSection.getByRole("heading", { name: title })).toBeVisible();
    await expect(featuredSection.getByText("Featured story", { exact: true })).toBeVisible();

    // Open detail page and check for Featured badge
    await featuredSection.getByRole("link", { name: "Read story" }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("Featured story", { exact: true })).toBeVisible();

    // Return to admin and unfeature
    await page.goto("/admin?tab=stories");
    await statusFilter(page, "Approved").click();
    const cardToUnfeature = storyCard(page, title);
    await cardToUnfeature.getByRole("button", { name: `Unfeature ${title}` }).click();
    await expect(page.getByText(new RegExp(`Unfeatured “${title}”`))).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("a reader receives a reference code and can track submission status", async ({ page }) => {
    const errors = trackPageErrors(page);
    const title = uniqueTitle("E2E Status Tracking Story");

    // Submit with category 'concert'
    const refCode = await submitStory(page, title, { category: "concert" });
    expect(refCode).toBeTruthy();

    // Look up status on the submission page while pending
    await page.locator("#lookup-code").fill(refCode);
    await page.getByRole("button", { name: "Check status" }).click();

    const resultCard = page.getByTestId("lookup-result-card");
    await expect(resultCard).toBeVisible();
    await expect(resultCard).toContainText(refCode);
    await expect(resultCard).toContainText(title);
    await expect(resultCard).toContainText("Concert");
    await expect(resultCard).toContainText("Pending Review");

    // Look up with invalid code
    await page.locator("#lookup-code").fill("MWB-NOTEXIST9");
    await page.getByRole("button", { name: "Check status" }).click();
    await expect(page.getByRole("alert")).toContainText(
      'No story was found with reference code "MWB-NOTEXIST9"',
    );

    // Admin rejects the story with reason
    const admin = createE2eAdmin();
    await openModerationQueue(page, admin);
    const pendingCard = storyCard(page, title);
    await pendingCard.getByRole("button", { name: `Reject ${title}` }).click();
    const dialog = page.getByRole("dialog");
    await page.locator("#reject-reason").selectOption("Insufficient detail");
    await page.locator("#reject-note").fill("Already covered in last month's notes.");
    await dialog.getByRole("button", { name: "Reject story" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(new RegExp(`Rejected “${title}”`))).toBeVisible();

    // Reader looks up status again -> now shows rejected with reason
    await page.goto("/stories/submit");
    await page.locator("#lookup-code").fill(refCode);
    await page.getByRole("button", { name: "Check status" }).click();

    await expect(resultCard).toBeVisible();
    await expect(resultCard).toContainText("Not Published");
    await expect(resultCard).toContainText(
      "Insufficient detail: Already covered in last month's notes.",
    );

    expect(errors).toEqual([]);
  });

  test("public stories can be filtered by category on the stories page", async ({ page }) => {
    const errors = trackPageErrors(page);
    const concertTitle = uniqueTitle("E2E Concert Category Story");
    const libraryTitle = uniqueTitle("E2E Library Category Story");

    // Submit two stories in different categories
    await submitStory(page, concertTitle, { category: "concert" });
    await submitStory(page, libraryTitle, { category: "lending-library" });

    // Approve both stories as admin
    const admin = createE2eAdmin();
    await openModerationQueue(page, admin);

    page.once("dialog", (d) => d.accept());
    await storyCard(page, concertTitle)
      .getByRole("button", { name: `Approve ${concertTitle}` })
      .click();
    await expect(page.getByText(/It is now public\./)).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await storyCard(page, libraryTitle)
      .getByRole("button", { name: `Approve ${libraryTitle}` })
      .click();
    await expect(page.getByText(/It is now public\./)).toBeVisible();

    // Go to public stories page
    await page.goto("/stories");
    const categoryGroup = page.getByRole("group", { name: "Filter stories by category" });
    await expect(categoryGroup).toBeVisible();

    // Filter by Concert: concert story visible, library story not visible
    await categoryGroup.getByRole("button", { name: /^Concert/ }).click();
    await expect(page.getByRole("heading", { name: concertTitle })).toBeVisible();
    await expect(page.getByRole("heading", { name: libraryTitle })).toHaveCount(0);

    // Filter by Lending Library: library story visible, concert story not visible
    await categoryGroup.getByRole("button", { name: /^Lending Library/ }).click();
    await expect(page.getByRole("heading", { name: libraryTitle })).toBeVisible();
    await expect(page.getByRole("heading", { name: concertTitle })).toHaveCount(0);

    // Filter by All stories: both stories visible
    await categoryGroup.getByRole("button", { name: /^All stories/ }).click();
    await expect(page.getByRole("heading", { name: concertTitle })).toBeVisible();
    await expect(page.getByRole("heading", { name: libraryTitle })).toBeVisible();

    expect(errors).toEqual([]);
  });
});
