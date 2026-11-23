import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const E2E_ADMIN_CREDENTIALS_FILE = "mwb-e2e-admin.json";

export default async function globalSetup(): Promise<void> {
  const backendDir = path.resolve(process.cwd(), "backend");
  const dbPath = process.env.DB_DATABASE ?? path.resolve(backendDir, "database/e2e.sqlite");
  const dbConnection = process.env.DB_CONNECTION ?? "sqlite";
  const cacheDir = path.resolve(backendDir, "storage/framework/cache");

  // Ensure database directory and file exist for SQLite
  if (dbConnection === "sqlite") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, "");
    }
  }

  // Ensure PsySH cache directory exists for Tinker
  fs.mkdirSync(path.join(cacheDir, "PsySH"), { recursive: true });

  const env = {
    ...process.env,
    DB_CONNECTION: dbConnection,
    DB_DATABASE: dbPath,
    APP_ENV: process.env.APP_ENV ?? "testing",
    APPDATA: cacheDir,
  };

  // Clear config and application cache
  execFileSync("php", ["artisan", "config:clear"], {
    cwd: backendDir,
    env,
    stdio: "pipe",
  });
  execFileSync("php", ["artisan", "cache:clear"], {
    cwd: backendDir,
    env,
    stdio: "pipe",
  });

  // Migrate and seed the isolated E2E database
  execFileSync("php", ["artisan", "migrate:fresh", "--seed", "--force"], {
    cwd: backendDir,
    env,
    stdio: "pipe",
  });

  // Create runtime admin with disposable random password
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
    env,
    stdio: "pipe",
  });

  const credsPath = path.join(os.tmpdir(), E2E_ADMIN_CREDENTIALS_FILE);
  fs.writeFileSync(credsPath, JSON.stringify({ email, password }), "utf-8");
}
