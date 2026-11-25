import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildLocalLaravelEnv,
  ensureBackendDirectories,
  ensureEnvFiles,
  hasNonEmptyEnvValue,
  isAutomatedEnvironment,
  isPlaceholderStripeSecret,
  readEnvValue,
} from "./bootstrap.mjs";

const tempRoots = [];

function createTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mwb-bootstrap-"));
  tempRoots.push(dir);
  fs.mkdirSync(path.join(dir, "server"), { recursive: true });
  fs.mkdirSync(path.join(dir, "backend"), { recursive: true });
  return dir;
}

afterEach(() => {
  for (const dir of tempRoots.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("buildLocalLaravelEnv", () => {
  it("switches a fresh clone from MySQL to zero-config local SQLite", () => {
    const example = [
      "APP_ENV=staging",
      "APP_KEY=",
      "DB_CONNECTION=mysql",
      "DB_HOST=127.0.0.1",
      "DB_PORT=3306",
      "DB_DATABASE=community_band_db",
      "DB_USERNAME=root",
      "DB_PASSWORD=",
    ].join("\n");

    const result = buildLocalLaravelEnv(example);

    expect(result).toContain("APP_ENV=local");
    expect(result).toContain("DB_CONNECTION=sqlite");
    expect(result).toContain("# DB_HOST=127.0.0.1");
    expect(result).toContain("# DB_PORT=3306");
    expect(result).toContain("# DB_DATABASE=community_band_db");
    expect(result).toContain("# DB_USERNAME=root");
    expect(result).toContain("# DB_PASSWORD=");
  });
});

describe("env helpers", () => {
  it("detects populated vs empty env keys", () => {
    expect(hasNonEmptyEnvValue("APP_KEY=base64:abc123\n", "APP_KEY")).toBe(true);
    expect(hasNonEmptyEnvValue("APP_KEY=\n", "APP_KEY")).toBe(false);
    expect(hasNonEmptyEnvValue("# APP_KEY=abc\n", "APP_KEY")).toBe(false);
    expect(hasNonEmptyEnvValue('APP_KEY=""\n', "APP_KEY")).toBe(false);
  });

  it("identifies placeholder Stripe secret keys", () => {
    expect(isPlaceholderStripeSecret(null)).toBe(true);
    expect(isPlaceholderStripeSecret("")).toBe(true);
    expect(isPlaceholderStripeSecret("sk_test_replace_me")).toBe(true);
    expect(isPlaceholderStripeSecret("sk_test_real12345")).toBe(false);
    expect(isPlaceholderStripeSecret("sk_live_real12345")).toBe(false);
  });

  it("creates missing .env files without overwriting existing ones", () => {
    const root = createTempRepo();
    fs.writeFileSync(
      path.join(root, ".env.example"),
      "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me\n",
    );
    fs.writeFileSync(
      path.join(root, "server", ".env.example"),
      "STRIPE_SECRET_KEY=sk_test_replace_me\n",
    );
    fs.writeFileSync(
      path.join(root, "backend", ".env.example"),
      "APP_ENV=staging\nDB_CONNECTION=mysql\nDB_DATABASE=community_band_db\n",
    );

    // Pre-existing custom server/.env must stay untouched.
    fs.writeFileSync(path.join(root, "server", ".env"), "STRIPE_SECRET_KEY=sk_test_custom\n");

    const silentLogger = { log() {} };
    ensureEnvFiles(root, silentLogger);

    expect(fs.existsSync(path.join(root, ".env"))).toBe(true);
    expect(readEnvValue(path.join(root, "server", ".env"), "STRIPE_SECRET_KEY")).toBe(
      "sk_test_custom",
    );
    expect(readEnvValue(path.join(root, "backend", ".env"), "DB_CONNECTION")).toBe("sqlite");
    expect(readEnvValue(path.join(root, "backend", ".env"), "DB_DATABASE")).toBeNull();
  });

  it("creates required Laravel storage and cache directories", () => {
    const root = createTempRepo();
    const backendDir = path.join(root, "backend");

    ensureBackendDirectories(backendDir);

    expect(fs.existsSync(path.join(backendDir, "storage", "logs"))).toBe(true);
    expect(fs.existsSync(path.join(backendDir, "storage", "app", "private"))).toBe(true);
    expect(fs.existsSync(path.join(backendDir, "storage", "framework", "cache", "data"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(backendDir, "bootstrap", "cache"))).toBe(true);
  });

  it("identifies CI and hosted build environments so postinstall skips dev bootstrap", () => {
    expect(isAutomatedEnvironment({})).toBe(false);
    expect(isAutomatedEnvironment({ CI: "false" })).toBe(false);
    expect(isAutomatedEnvironment({ CI: "0" })).toBe(false);
    expect(isAutomatedEnvironment({ CI: "true" })).toBe(true);
    expect(isAutomatedEnvironment({ CI: "1" })).toBe(true);
    expect(isAutomatedEnvironment({ VERCEL: "1" })).toBe(true);
    expect(isAutomatedEnvironment({ RAILWAY_ENVIRONMENT: "production" })).toBe(true);
  });
});
