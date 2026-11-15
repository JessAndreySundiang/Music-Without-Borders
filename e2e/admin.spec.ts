import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, trackPageErrors } from "./helpers";

test.describe("admin authentication", () => {
  test("the dashboard is protected and the sign-in page is complete", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Welcome back to the bandstand.",
    );
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in to the CMS" })).toBeVisible();
  });

  test("invalid credentials show a safe error", async ({ page }) => {
    const errors = trackPageErrors(page);

    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("not-the-admin-password");
    await page.getByRole("button", { name: "Sign in to the CMS" }).click();

    await expect(page.getByRole("alert")).toContainText("The email or password is incorrect.");
    expect(errors).toEqual([]);
  });

  test("forgot password uses a non-enumerating response", async ({ page }) => {
    await page.goto("/admin/forgot-password");
    await page.getByLabel("Administrator email").fill("missing@example.com");
    await page.getByRole("button", { name: /Prepare a reset link/i }).click();

    await expect(
      page.getByText(
        /If that email belongs to an administrator, a one-time reset link has been prepared/i,
      ),
    ).toBeVisible();
  });

  test("the sign-in page has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
