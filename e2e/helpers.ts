import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

export interface E2eAdmin {
  email: string;
  password: string;
}

/**
 * Flushes the cache (and rate limiter hits) on the isolated test backend.
 */
export function resetE2eCache(): void {
  const backendDir = path.resolve(process.cwd(), "backend");
  const dbPath = process.env.DB_DATABASE ?? path.resolve(backendDir, "database/e2e.sqlite");
  const cacheDir = path.resolve(backendDir, "storage/framework/cache");

  fs.mkdirSync(path.join(cacheDir, "PsySH"), { recursive: true });

  execFileSync(
    "php",
    ["artisan", "tinker", "--execute", "\\Illuminate\\Support\\Facades\\Cache::flush();"],
    {
      cwd: backendDir,
      env: {
        ...process.env,
        DB_CONNECTION: process.env.DB_CONNECTION ?? "sqlite",
        DB_DATABASE: dbPath,
        APP_ENV: process.env.APP_ENV ?? "testing",
        APPDATA: cacheDir,
      },
      stdio: "pipe",
    },
  );
}

/**
 * Creates or retrieves the disposable administrator for E2E tests.
 * The credentials can be read from OS temp (created during global-setup)
 * or generated against the isolated SQLite test database.
 */
export function createE2eAdmin(): E2eAdmin {
  const credsPath = path.join(os.tmpdir(), "mwb-e2e-admin.json");
  if (fs.existsSync(credsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(credsPath, "utf-8"));
      if (data.email && data.password) {
        return data as E2eAdmin;
      }
    } catch {
      // Fall through to recreation
    }
  }

  const backendDir = path.resolve(process.cwd(), "backend");
  const dbPath = process.env.DB_DATABASE ?? path.resolve(backendDir, "database/e2e.sqlite");
  const dbConnection = process.env.DB_CONNECTION ?? "sqlite";
  const cacheDir = path.resolve(backendDir, "storage/framework/cache");

  fs.mkdirSync(path.join(cacheDir, "PsySH"), { recursive: true });

  const email = "e2e-admin@example.com";
  const password = `E2e-${randomBytes(18).toString("base64url")}`;
  const code = [
    "\\Illuminate\\Support\\Facades\\Cache::flush();",
    "\\App\\Models\\User::query()->updateOrCreate(",
    `['email' => ${JSON.stringify(email)}],`,
    `['name' => 'E2E Admin', 'password' => \\Illuminate\\Support\\Facades\\Hash::make(${JSON.stringify(password)}), 'is_admin' => true]`,
    ");",
  ].join(" ");

  execFileSync("php", ["artisan", "tinker", "--execute", code], {
    cwd: backendDir,
    env: {
      ...process.env,
      DB_CONNECTION: dbConnection,
      DB_DATABASE: dbPath,
      APP_ENV: process.env.APP_ENV ?? "testing",
      APPDATA: cacheDir,
    },
    stdio: "pipe",
  });

  try {
    fs.writeFileSync(credsPath, JSON.stringify({ email, password }), "utf-8");
  } catch {
    // Ignore temp file write error
  }

  return { email, password };
}

export async function signInAsAdmin(page: Page, admin: E2eAdmin): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(admin.email);
  await page.getByLabel("Password").fill(admin.password);
  await page.getByRole("button", { name: "Sign in to the CMS" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Welcome back to the CMS/i }),
  ).toBeVisible();
}

export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const summary = results.violations
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
    .join("\n");

  expect(results.violations, summary).toEqual([]);
}
