import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isWindows = process.platform === "win32";

/**
 * Converts backend/.env.example into a zero-config SQLite local configuration so
 * a fresh clone from GitHub boots without requiring a local MySQL daemon.
 */
export function buildLocalLaravelEnv(exampleContent) {
  return exampleContent
    .replace(/^APP_ENV=.*$/m, "APP_ENV=local")
    .replace(/^DB_CONNECTION=.*$/m, "DB_CONNECTION=sqlite")
    .replace(/^(DB_(?:HOST|PORT|DATABASE|USERNAME|PASSWORD)=.*)$/gm, "# $1");
}

/**
 * Returns true if the given .env file content assigns a non-empty value to key.
 */
export function hasNonEmptyEnvValue(envContent, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = envContent.match(new RegExp(`^${escaped}=(.*)$`, "m"));
  if (!match) return false;
  const value = match[1].trim().replace(/^["']|["']$/g, "");
  return value.length > 0;
}

/**
 * Reads an env key's value from an .env file on disk, or null if absent.
 */
export function readEnvValue(filePath, key) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^${escaped}=(.*)$`, "m"));
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

/**
 * Placeholder keys shipped in .env.example let the dev donation server boot
 * without a Stripe account, while clearly signalling placeholder status.
 */
export function isPlaceholderStripeSecret(secretKey) {
  return !secretKey || /replace_me/i.test(secretKey);
}

/**
 * Ensures .env, server/.env, and backend/.env exist without touching files that
 * the developer has already customized.
 */
export function ensureEnvFiles(rootDir, logger = console) {
  const rootEnv = path.join(rootDir, ".env");
  const rootExample = path.join(rootDir, ".env.example");
  if (!fs.existsSync(rootEnv) && fs.existsSync(rootExample)) {
    fs.copyFileSync(rootExample, rootEnv);
    logger.log("[setup] Created .env from .env.example");
  }

  const serverEnv = path.join(rootDir, "server", ".env");
  const serverExample = path.join(rootDir, "server", ".env.example");
  if (!fs.existsSync(serverEnv) && fs.existsSync(serverExample)) {
    fs.copyFileSync(serverExample, serverEnv);
    logger.log("[setup] Created server/.env from server/.env.example");
  }

  const backendEnv = path.join(rootDir, "backend", ".env");
  const backendExample = path.join(rootDir, "backend", ".env.example");
  if (!fs.existsSync(backendEnv) && fs.existsSync(backendExample)) {
    const template = fs.readFileSync(backendExample, "utf8");
    fs.writeFileSync(backendEnv, buildLocalLaravelEnv(template), "utf8");
    logger.log("[setup] Created backend/.env (configured for local SQLite)");
  }
}

/**
 * Creates Laravel runtime directories that may be absent in a fresh archive.
 */
export function ensureBackendDirectories(backendDir) {
  const dirs = [
    "database",
    "bootstrap/cache",
    "storage/app/private",
    "storage/app/public",
    "storage/framework/cache/data",
    "storage/framework/sessions",
    "storage/framework/testing",
    "storage/framework/views",
    "storage/logs",
  ];
  for (const rel of dirs) {
    fs.mkdirSync(path.join(backendDir, rel), { recursive: true });
  }
}

/**
 * Locates a working PHP binary, checking PATH first and common Windows install
 * locations (XAMPP) as a convenience fallback.
 */
export function findPhpExecutable(probe = spawnSync) {
  const candidates = isWindows ? ["php", "C:\\xampp\\php\\php.exe", "C:\\php\\php.exe"] : ["php"];

  for (const candidate of candidates) {
    if (candidate.includes(path.sep) && !fs.existsSync(candidate)) continue;
    try {
      const result = probe(candidate, ["--version"], { encoding: "utf8" });
      if (result.status === 0) return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

function runShellCommand(commandLine, cwd, env = process.env) {
  return spawnSync(commandLine, {
    cwd,
    env,
    stdio: "inherit",
    shell: true,
  });
}

function runDirectCommand(command, args, cwd, capture = false) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
}

/**
 * Returns true when running inside CI or a hosted build environment where local
 * dev postinstall setup (SQLite/Composer dev deps) should be skipped.
 */
export function isAutomatedEnvironment(env = process.env) {
  const ci = env.CI;
  const inCi = Boolean(ci && ci !== "0" && ci.toLowerCase() !== "false");
  return inCi || Boolean(env.VERCEL) || Boolean(env.RAILWAY_ENVIRONMENT);
}

/**
 * Prepares all local workspace pieces (npm deps, Composer deps, .env files,
 * Laravel key, migrations, initial seed, and admin setup link) idempotently.
 */
export function runBootstrap({ rootDir, postinstall = false, logger = console } = {}) {
  if (postinstall && isAutomatedEnvironment()) {
    return { rootDir, phpCmd: null, backendReady: false, skipped: true };
  }

  const rootVite = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
  if (!postinstall && !fs.existsSync(rootVite)) {
    logger.log("[setup] Installing web dependencies...");
    const cleanEnv = { ...process.env };
    delete cleanEnv.npm_lifecycle_event;
    delete cleanEnv.npm_lifecycle_script;
    const res = runShellCommand(
      "npm install --no-audit --no-fund --ignore-scripts",
      rootDir,
      cleanEnv,
    );
    if (res.status !== 0) {
      throw new Error("Failed to install root web dependencies via npm install.");
    }
  }

  const serverDir = path.join(rootDir, "server");
  const serverDotenv = path.join(serverDir, "node_modules", "dotenv", "package.json");
  const serverExpress = path.join(serverDir, "node_modules", "express", "package.json");
  if (!fs.existsSync(serverDotenv) || !fs.existsSync(serverExpress)) {
    logger.log("[setup] Installing donation API dependencies (server/)...");
    const cleanEnv = { ...process.env };
    delete cleanEnv.npm_lifecycle_event;
    delete cleanEnv.npm_lifecycle_script;
    const res = runShellCommand("npm install --no-audit --no-fund", serverDir, cleanEnv);
    if (res.status !== 0) {
      throw new Error("Failed to install donation API dependencies in server/.");
    }
  }

  ensureEnvFiles(rootDir, logger);

  const backendDir = path.join(rootDir, "backend");
  ensureBackendDirectories(backendDir);

  const phpCmd = findPhpExecutable();
  if (!phpCmd) {
    logger.log(
      "[cms] PHP 8.2+ was not found in PATH. Frontend and donation API will still start, " +
        "but CMS pages (/stories, /performances, /about, /admin) need PHP & Composer.",
    );
    return { rootDir, phpCmd: null, backendReady: false };
  }

  const vendorAutoload = path.join(backendDir, "vendor", "autoload.php");
  if (!fs.existsSync(vendorAutoload)) {
    const hasComposer =
      spawnSync("composer --version", {
        cwd: backendDir,
        encoding: "utf8",
        stdio: "pipe",
        shell: true,
      }).status === 0;

    if (!hasComposer) {
      logger.log(
        "[cms] Composer was not found in PATH and backend/vendor is missing. " +
          "Install Composer (https://getcomposer.org/), then re-run npm run dev.",
      );
      return { rootDir, phpCmd, backendReady: false };
    }

    logger.log("[setup] Installing Laravel CMS dependencies (backend/)...");
    const res = runShellCommand("composer install --no-interaction --prefer-dist", backendDir);
    if (res.status !== 0) {
      logger.log("[cms] composer install failed. Check errors above and re-run npm run dev.");
      return { rootDir, phpCmd, backendReady: false };
    }
  }

  const cachedConfig = path.join(backendDir, "bootstrap", "cache", "config.php");
  if (fs.existsSync(cachedConfig)) {
    fs.rmSync(cachedConfig, { force: true });
  }

  const backendEnvPath = path.join(backendDir, ".env");
  if (fs.existsSync(backendEnvPath)) {
    const envBody = fs.readFileSync(backendEnvPath, "utf8");
    if (!hasNonEmptyEnvValue(envBody, "APP_KEY")) {
      logger.log("[setup] Generating Laravel application key...");
      const keyRes = runDirectCommand(phpCmd, ["artisan", "key:generate", "--force"], backendDir);
      if (keyRes.status !== 0) {
        return { rootDir, phpCmd, backendReady: false };
      }
    }
  }

  const adminLinkFile = path.join(backendDir, "storage", "app", "private", "admin-reset-link.txt");
  const hadAdminLinkBefore = fs.existsSync(adminLinkFile);

  const prepRes = runDirectCommand(phpCmd, ["artisan", "local:bootstrap"], backendDir);
  if (prepRes.status !== 0) {
    logger.log("[cms] Laravel database bootstrap failed (see error above).");
    return { rootDir, phpCmd, backendReady: false };
  }

  if (!hadAdminLinkBefore && fs.existsSync(adminLinkFile)) {
    logger.log(
      "[cms] First-time admin setup link written to backend/storage/app/private/admin-reset-link.txt",
    );
  } else if (!postinstall && fs.existsSync(adminLinkFile)) {
    logger.log("[cms] Admin setup link ready at backend/storage/app/private/admin-reset-link.txt");
  }

  return { rootDir, phpCmd, backendReady: true };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const postinstall = process.argv.includes("--postinstall");
  try {
    runBootstrap({ rootDir, postinstall });
  } catch (error) {
    console.error(`[setup] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
