import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildLocalLaravelEnv,
  buildLocalMysqlEnv,
  ensureBackendDirectories,
  ensureEnvFiles,
  getLocalProfilePath,
  hasNonEmptyEnvValue,
  isAutomatedEnvironment,
  isPlaceholderStripeSecret,
  parseEnvEntries,
  readEnvValue,
  resolveDbModeFromArgs,
  saveLocalProfile,
  switchBackendEnvDatabase,
  upsertEnvValues,
} from "./bootstrap.mjs";

const tempRoots = [];

function createTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mwb-bootstrap-"));
  tempRoots.push(dir);
  fs.mkdirSync(path.join(dir, "server"), { recursive: true });
  fs.mkdirSync(path.join(dir, "backend"), { recursive: true });
  return dir;
}

function writeSampleTemplates(root) {
  fs.writeFileSync(
    path.join(root, ".env.example"),
    "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me\nVITE_API_BASE_URL=http://127.0.0.1:8000/api\n",
  );
  fs.writeFileSync(
    path.join(root, "server", ".env.example"),
    "STRIPE_SECRET_KEY=sk_test_replace_me\nSTRIPE_WEBHOOK_SECRET=whsec_replace_me\n# GMAIL_USER=you@gmail.com\n",
  );
  fs.writeFileSync(
    path.join(root, "backend", ".env.example"),
    [
      "APP_ENV=staging",
      "APP_KEY=",
      "DB_CONNECTION=mysql",
      "DB_HOST=127.0.0.1",
      "DB_PORT=3306",
      "DB_DATABASE=community_band_db",
      "DB_USERNAME=root",
      "DB_PASSWORD=",
    ].join("\n") + "\n",
  );
}

afterEach(() => {
  for (const dir of tempRoots.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("buildLocalLaravelEnv and switchBackendEnvDatabase", () => {
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

  it("switches a fresh clone from MySQL to zero-config local SQLite", () => {
    const result = buildLocalLaravelEnv(example);

    expect(result).toContain("APP_ENV=local");
    expect(result).toContain("DB_CONNECTION=sqlite");
    expect(result).toContain("# DB_HOST=127.0.0.1");
    expect(result).toContain("# DB_PORT=3306");
    expect(result).toContain("# DB_DATABASE=community_band_db");
    expect(result).toContain("# DB_USERNAME=root");
    expect(result).toContain("# DB_PASSWORD=");
  });

  it("keeps XAMPP MySQL settings intact when building local MySQL env", () => {
    const result = buildLocalMysqlEnv(example);

    expect(result).toContain("APP_ENV=local");
    expect(result).toContain("DB_CONNECTION=mysql");
    expect(result).toContain("DB_DATABASE=community_band_db");
    expect(result).not.toContain("# DB_DATABASE");
  });

  it("switches between SQLite and MySQL idempotently without losing APP_KEY", () => {
    const sqlite = buildLocalLaravelEnv(example).replace("APP_KEY=", "APP_KEY=base64:keepme");
    const mysql = switchBackendEnvDatabase(sqlite, "mysql", example);
    expect(mysql).toContain("APP_KEY=base64:keepme");
    expect(mysql).toContain("DB_CONNECTION=mysql");
    expect(mysql).toContain("DB_DATABASE=community_band_db");

    const backToSqlite = switchBackendEnvDatabase(mysql, "sqlite", example);
    expect(backToSqlite).toContain("APP_KEY=base64:keepme");
    expect(backToSqlite).toContain("DB_CONNECTION=sqlite");
    expect(backToSqlite).toContain("# DB_DATABASE=community_band_db");
  });
});

describe("env and local profile helpers", () => {
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
    expect(isPlaceholderStripeSecret("sk_test_abc")).toBe(false);
    expect(isPlaceholderStripeSecret("sk_live_abc")).toBe(false);
  });

  it("parses env entries and uncomments/updates placeholders safely", () => {
    const parsed = parseEnvEntries('# comment\nKEY_ONE=val1\nQUOTED="hello world"\nEMPTY=\n');
    expect(parsed).toEqual({ KEY_ONE: "val1", QUOTED: "hello world", EMPTY: "" });

    const original =
      "STRIPE_SECRET_KEY=sk_test_replace_me\n# GMAIL_USER=you@gmail.com\nDB_PASSWORD=\n";
    const updated = upsertEnvValues(original, {
      STRIPE_SECRET_KEY: "sk_test_real",
      GMAIL_USER: "band@example.com",
      DB_PASSWORD: "p$ss#1$&$$",
    });
    expect(updated).toContain("STRIPE_SECRET_KEY=sk_test_real");
    expect(updated).toContain("GMAIL_USER=band@example.com");
    expect(updated).toContain('DB_PASSWORD="p$ss#1$&$$"');
    expect(updated).not.toContain("# GMAIL_USER");
  });

  it("creates missing .env files without overwriting custom ones", () => {
    const root = createTempRepo();
    writeSampleTemplates(root);
    fs.writeFileSync(path.join(root, "server", ".env"), "STRIPE_SECRET_KEY=sk_test_custom\n");

    const silentLogger = { log() {} };
    ensureEnvFiles(root, {
      logger: silentLogger,
      localProfilePath: path.join(root, "nonexistent-profile.env"),
      mysqlProbe: () => false,
    });

    expect(fs.existsSync(path.join(root, ".env"))).toBe(true);
    expect(readEnvValue(path.join(root, "server", ".env"), "STRIPE_SECRET_KEY")).toBe(
      "sk_test_custom",
    );
    expect(readEnvValue(path.join(root, "backend", ".env"), "DB_CONNECTION")).toBe("sqlite");
    expect(readEnvValue(path.join(root, "backend", ".env"), "DB_DATABASE")).toBeNull();
  });

  it("auto-selects local MySQL when reachable and falls back to SQLite otherwise", () => {
    const root = createTempRepo();
    writeSampleTemplates(root);
    const silentLogger = { log() {} };

    ensureEnvFiles(root, {
      logger: silentLogger,
      localProfilePath: path.join(root, "missing.env"),
      mysqlProbe: () => true,
    });

    expect(readEnvValue(path.join(root, "backend", ".env"), "DB_CONNECTION")).toBe("mysql");
    expect(readEnvValue(path.join(root, "backend", ".env"), "DB_DATABASE")).toBe(
      "community_band_db",
    );
  });

  it("saves non-secret defaults & Stripe/MySQL config to external profile and restores into fresh clone", () => {
    const sourceRoot = createTempRepo();
    writeSampleTemplates(sourceRoot);
    const profilePath = path.join(sourceRoot, "..", `${path.basename(sourceRoot)}-profile.env`);
    tempRoots.push(profilePath);

    // Populate source workspace like a configured developer setup.
    fs.writeFileSync(
      path.join(sourceRoot, ".env"),
      "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_saved\nVITE_API_BASE_URL=http://127.0.0.1:8000/api\n",
    );
    fs.writeFileSync(
      path.join(sourceRoot, "server", ".env"),
      "STRIPE_SECRET_KEY=sk_test_saved\nSTRIPE_WEBHOOK_SECRET=whsec_replace_me\nGMAIL_USER=band@gmail.com\n",
    );
    fs.writeFileSync(
      path.join(sourceRoot, "backend", ".env"),
      [
        "APP_ENV=local",
        "APP_KEY=base64:secret-should-not-copy",
        "DB_CONNECTION=mysql",
        "DB_HOST=127.0.0.1",
        "DB_PORT=3306",
        "DB_DATABASE=community_band_db",
        "DB_USERNAME=root",
        "DB_PASSWORD=",
      ].join("\n") + "\n",
    );

    const silentLogger = { log() {} };
    const saved = saveLocalProfile(sourceRoot, {
      localProfilePath: profilePath,
      logger: silentLogger,
    });

    expect(saved.keys).toContain("VITE_STRIPE_PUBLISHABLE_KEY");
    expect(saved.keys).toContain("STRIPE_SECRET_KEY");
    expect(saved.keys).toContain("GMAIL_USER");
    expect(saved.keys).toContain("DB_CONNECTION");
    expect(saved.keys).not.toContain("APP_KEY");
    expect(saved.keys).not.toContain("STRIPE_WEBHOOK_SECRET");

    // Simulate a brand-new clone on the same machine.
    const freshRoot = createTempRepo();
    writeSampleTemplates(freshRoot);
    ensureEnvFiles(freshRoot, {
      logger: silentLogger,
      localProfilePath: profilePath,
      mysqlProbe: () => false,
    });

    expect(readEnvValue(path.join(freshRoot, ".env"), "VITE_STRIPE_PUBLISHABLE_KEY")).toBe(
      "pk_test_saved",
    );
    expect(readEnvValue(path.join(freshRoot, "server", ".env"), "STRIPE_SECRET_KEY")).toBe(
      "sk_test_saved",
    );
    expect(readEnvValue(path.join(freshRoot, "server", ".env"), "GMAIL_USER")).toBe(
      "band@gmail.com",
    );
    expect(readEnvValue(path.join(freshRoot, "backend", ".env"), "DB_CONNECTION")).toBe("mysql");
    expect(readEnvValue(path.join(freshRoot, "backend", ".env"), "APP_KEY")).toBe("");

    // Switching explicitly to SQLite must keep DB_DATABASE commented out.
    ensureEnvFiles(freshRoot, {
      logger: silentLogger,
      dbMode: "sqlite",
      localProfilePath: profilePath,
    });
    expect(readEnvValue(path.join(freshRoot, "backend", ".env"), "DB_CONNECTION")).toBe("sqlite");
    expect(readEnvValue(path.join(freshRoot, "backend", ".env"), "DB_DATABASE")).toBeNull();
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

  it("identifies CI, hosted environments, CLI flags, and profile path", () => {
    expect(isAutomatedEnvironment({})).toBe(false);
    expect(isAutomatedEnvironment({ CI: "false" })).toBe(false);
    expect(isAutomatedEnvironment({ CI: "0" })).toBe(false);
    expect(isAutomatedEnvironment({ CI: "true" })).toBe(true);
    expect(isAutomatedEnvironment({ CI: "1" })).toBe(true);
    expect(isAutomatedEnvironment({ VERCEL: "1" })).toBe(true);
    expect(isAutomatedEnvironment({ RAILWAY_ENVIRONMENT: "production" })).toBe(true);

    expect(resolveDbModeFromArgs(["node", "dev.mjs"])).toBe("auto");
    expect(resolveDbModeFromArgs(["node", "dev.mjs", "--mysql"])).toBe("mysql");
    expect(resolveDbModeFromArgs(["node", "dev.mjs", "--sqlite"])).toBe("sqlite");

    expect(getLocalProfilePath({ MWB_LOCAL_ENV: "./tmp-local.env" })).toBe(
      path.resolve("./tmp-local.env"),
    );
  });
});
