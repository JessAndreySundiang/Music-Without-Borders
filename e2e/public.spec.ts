import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, trackPageErrors } from "./helpers";

test.describe("public site", () => {
  test("the home page is branded and renders CMS content", async ({ page }) => {
    const errors = trackPageErrors(page);

    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /Music that belongs to everyone/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: /Music Without Borders/i }),
    ).toBeVisible();
    await expect(page.locator("footer")).toContainText("Music Without Borders");

    expect(errors).toEqual([]);
  });

  test("primary navigation reaches every public page", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Music should be within everyone's reach",
    );

    await nav.getByRole("link", { name: "Stories" }).click();
    await expect(page).toHaveURL(/\/stories$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Notes from the Bandstand");
  });

  for (const route of [
    {
      path: "/performances",
      heading: "Live Performances & Rehearsal Schedule",
    },
    { path: "/instruments", heading: "Meet the instruments behind the music." },
    { path: "/about", heading: "Music should be within everyone's reach." },
    { path: "/stories", heading: "Notes from the Bandstand" },
    { path: "/donate", heading: "Help us keep the music free." },
  ]) {
    test(`${route.path} loads its page hero`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(route.heading);
    });
  }

  test("approved Stories open their article pages", async ({ page }) => {
    await page.goto("/stories");

    const firstCard = page.getByRole("article").first();
    await expect(firstCard).toBeVisible();

    const title = (await firstCard.getByRole("heading", { level: 2 }).innerText()).trim();
    expect(title.length).toBeGreaterThan(0);

    await firstCard.getByRole("link", { name: title, exact: true }).click();

    await expect(page).toHaveURL(/\/stories\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByText("Sample story", { exact: true })).toHaveCount(0);
  });

  test("the legacy blog URL redirects to Stories", async ({ page }) => {
    await page.goto("/blog");

    await expect(page).toHaveURL(/\/stories$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Notes from the Bandstand");
  });

  test("the performances page can filter without a reload", async ({ page }) => {
    await page.goto("/performances");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Live Performances & Rehearsal Schedule",
    );

    const search = page.getByPlaceholder("Search events, cities, venues...");
    await search.fill("no-such-performance");
    await expect(page.getByRole("heading", { name: "No Performances Found" })).toBeVisible();

    await page.getByRole("button", { name: "Clear Filters" }).click();
    await expect(page.getByPlaceholder("Search events, cities, venues...")).toHaveValue("");
  });

  test("the theme toggle persists the visitor choice", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "Switch to Daytime theme" }).click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("mwb-theme")))
      .toBe("light");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
  });

  test("the 404 page keeps visitors inside the site", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "This page has left the stage.",
    );
    await expect(page.getByRole("link", { name: /Go to Home/i })).toBeVisible();
  });

  test("public pages have no WCAG A/AA violations", async ({ page }) => {
    for (const path of ["/", "/about", "/stories"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoA11yViolations(page);
    }
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("the menu opens, navigates, and avoids horizontal overflow", async ({ page }) => {
      await page.goto("/");

      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.locator("#primary-navigation").getByRole("link", { name: "About" }).click();

      await expect(page).toHaveURL(/\/about$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Music should be within everyone's reach",
      );

      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      );
      expect(noOverflow).toBe(true);
    });
  });
});
