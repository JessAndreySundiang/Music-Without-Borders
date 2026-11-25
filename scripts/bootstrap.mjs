import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isWindows = process.platform === "win32";

const MYSQL_ENV_KEYS = ["DB_HOST", "DB_PORT", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD"];
const NEVER_PROFILE_KEYS = new Set(["APP_KEY", "APP_ENV", "PORT"]);

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
 * Placeholder keys shipped in .env.example let the dev server boot without a
 * Stripe account, while clearly signalling placeholder status.
 */
export function isPlaceholderStripeSecret(secretKey) {
  return !secretKey || /replace_me/i.test(secretKey);
}

/**
 * Parses active KEY=VALUE pairs from an .env file, ignoring blank lines and comments.
 */
export function parseEnvEntries(content) {
  const entries = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const value = line
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    entries[key] = value;
  }
  return entries;
}

/**
 * Collects env key names declared in an .env.example template (active or commented).
 */
export function extractDeclaredKeys(exampleContent) {
  const keys = new Set();
  for (const rawLine of exampleContent.split(/\r?\n/)) {
    const match = rawLine.match(/^\s*(?:#\s*)?([A-Z][A-Z0-9_]*)=/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

function formatEnvValue(value) {
  const str = String(value ?? "");
  if (str === "") return "";
  if (/[\s"'`#]/.test(str)) {
    return JSON.stringify(str);
  }
  return str;
}

function isPlaceholderOrDefault(key, value) {
  if (!value) return true;
  if (/replace_me/i.test(value)) return true;
  if (key === "MAIL_FROM_ADDRESS" && value === "hello@example.com") return true;
  if (value === "null") return true;
  return false;
}

/**
 * Updates or inserts KEY=VALUE pairs in .env text without losing comments or formatting.
 */
export function upsertEnvValues(envContent, updates, { overwriteExisting = false } = {}) {
  let result = envContent;

  for (const [key, value] of Object.entries(updates)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const activePattern = new RegExp(`^(${escaped})=(.*)$`, "m");
    const commentedPattern = new RegExp(`^#\\s*(${escaped})=(.*)$`, "m");
    const formatted = `${key}=${formatEnvValue(value)}`;

    const activeMatch = result.match(activePattern);
    if (activeMatch) {
      const current = activeMatch[2].trim().replace(/^["']|["']$/g, "");
      if (overwriteExisting || isPlaceholderOrDefault(key, current)) {
        result = result.replace(activePattern, () => formatted);
      }
      continue;
    }

    if (commentedPattern.test(result)) {
      result = result.replace(commentedPattern, () => formatted);
      continue;
    }

    const suffix = result.length > 0 && !result.endsWith("\n") ? "\n" : "";
    result = `${result}${suffix}${formatted}\n`;
  }

  return result;
}

/**
 * Switches backend/.env content cleanly between local SQLite and local MySQL,
 * keeping other keys (including APP_KEY) untouched.
 */
export function switchBackendEnvDatabase(envContent, mode, exampleContent = "") {
  if (mode === "sqlite") {
    let next = envContent.match(/^DB_CONNECTION=.*$/m)
      ? envContent.replace(/^DB_CONNECTION=.*$/m, "DB_CONNECTION=sqlite")
      : `DB_CONNECTION=sqlite\n${envContent}`;
    next = next.replace(/^(DB_(?:HOST|PORT|DATABASE|USERNAME|PASSWORD)=.*)$/gm, "# $1");
    return next;
  }

  if (mode === "mysql") {
    let next = envContent.match(/^DB_CONNECTION=.*$/m)
      ? envContent.replace(/^DB_CONNECTION=.*$/m, "DB_CONNECTION=mysql")
      : `DB_CONNECTION=mysql\n${envContent}`;

    for (const key of MYSQL_ENV_KEYS) {
      const activePattern = new RegExp(`^${key}=`, "m");
      const commentedPattern = new RegExp(`^#\\s*(${key}=.*)$`, "m");
      if (activePattern.test(next)) continue;
      if (commentedPattern.test(next)) {
        next = next.replace(commentedPattern, "$1");
        continue;
      }
      const fallbackMatch = exampleContent.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (fallbackMatch) {
        const suffix = next.length > 0 && !next.endsWith("\n") ? "\n" : "";
        next = `${next}${suffix}${key}=${fallbackMatch[1].trim()}\n`;
      }
    }
    return next;
  }

  return envContent;
}

/**
 * Converts backend/.env.example into a zero-config SQLite local configuration so
 * a fresh clone from GitHub boots without requiring a local MySQL daemon.
 */
export function buildLocalLaravelEnv(exampleContent) {
  const localEnv = exampleContent.replace(/^APP_ENV=.*$/m, "APP_ENV=local");
  return switchBackendEnvDatabase(localEnv, "sqlite", exampleContent);
}

/**
 * Converts backend/.env.example into a local MySQL/XAMPP configuration while keeping
 * APP_ENV=local.
 */
export function buildLocalMysqlEnv(exampleContent) {
  const localEnv = exampleContent.replace(/^APP_ENV=.*$/m, "APP_ENV=local");
  return switchBackendEnvDatabase(localEnv, "mysql", exampleContent);
}

/**
 * Path to the user's machine-local settings override file (never inside Git).
 */
export function getLocalProfilePath(env = process.env) {
  if (env.MWB_LOCAL_ENV) {
    return path.resolve(env.MWB_LOCAL_ENV);
  }
  return path.join(os.homedir(), ".mwb-local.env");
}

/**
 * Probes whether a local MySQL/XAMPP server is reachable with the default XAMPP
 * credentials (127.0.0.1:3306, root, empty password) so fresh installs can use it
 * automatically when started.
 */
export function findReachableLocalMysql(phpCmd, exampleContent = "", probe = spawnSync) {
  if (!phpCmd) return false;
  const host = exampleContent.match(/^DB_HOST=(.*)$/m)?.[1]?.trim() || "127.0.0.1";
  const port = exampleContent.match(/^DB_PORT=(.*)$/m)?.[1]?.trim() || "3306";
  const user = exampleContent.match(/^DB_USERNAME=(.*)$/m)?.[1]?.trim() || "root";
  const pass =
    exampleContent
      .match(/^DB_PASSWORD=(.*)$/m)?.[1]
      ?.trim()
      .replace(/^["']|["']$/g, "") ?? "";

  try {
    const res = probe(
      phpCmd,
      [
        "-r",
        "try { new PDO('mysql:host=' . $argv[1] . ';port=' . $argv[2], $argv[3], $argv[4], [PDO::ATTR_TIMEOUT => 1]); exit(0); } catch (Throwable $e) { exit(1); }",
        host,
        port,
        user,
        pass,
      ],
      { encoding: "utf8", timeout: 2500 },
    );
    return res.status === 0;
  } catch {
    return false;
  }
}

function loadLocalProfileEntries(localProfilePath) {
  if (!localProfilePath || !fs.existsSync(localProfilePath)) {
    return {};
  }
  return parseEnvEntries(fs.readFileSync(localProfilePath, "utf8"));
}

function filterUpdatesForTemplate(profileEntries, exampleContent, { extraPrefix } = {}) {
  const declared = extractDeclaredKeys(exampleContent);
  const filtered = {};
  for (const [key, value] of Object.entries(profileEntries)) {
    if (NEVER_PROFILE_KEYS.has(key)) continue;
    if (declared.has(key) || (extraPrefix && key.startsWith(extraPrefix))) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Saves non-default local settings (such as Stripe test keys, mail alert settings,
 * and XAMPP MySQL configuration) to ~/.mwb-local.env so future fresh clones pick them
 * up automatically without manual .env editing or risking secrets in Git.
 */
export function saveLocalProfile(
  rootDir,
  { localProfilePath = getLocalProfilePath(), logger = console } = {},
) {
  const targets = [
    { envFile: path.join(rootDir, ".env"), exampleFile: path.join(rootDir, ".env.example") },
    {
      envFile: path.join(rootDir, "server", ".env"),
      exampleFile: path.join(rootDir, "server", ".env.example"),
    },
    {
      envFile: path.join(rootDir, "backend", ".env"),
      exampleFile: path.join(rootDir, "backend", ".env.example"),
    },
  ];

  const saved = {};
  for (const { envFile, exampleFile } of targets) {
    if (!fs.existsSync(envFile)) continue;
    const currentEntries = parseEnvEntries(fs.readFileSync(envFile, "utf8"));
    const exampleEntries = fs.existsSync(exampleFile)
      ? parseEnvEntries(fs.readFileSync(exampleFile, "utf8"))
      : {};

    const isBackendEnv = path.basename(path.dirname(envFile)) === "backend";
    const isBackendMysql = isBackendEnv && currentEntries.DB_CONNECTION === "mysql";

    for (const [key, value] of Object.entries(currentEntries)) {
      if (NEVER_PROFILE_KEYS.has(key)) continue;
      if (isBackendEnv && key === "FRONTEND_URL") continue;

      if (isBackendMysql && (key === "DB_CONNECTION" || MYSQL_ENV_KEYS.includes(key))) {
        saved[key] = value;
        continue;
      }

      if (isPlaceholderOrDefault(key, value)) continue;
      if (
        Object.prototype.hasOwnProperty.call(exampleEntries, key) &&
        exampleEntries[key] === value
      ) {
        continue;
      }
      saved[key] = value;
    }
  }

  const lines = [
    "# Machine-local overrides for Music Without Borders (auto-loaded by npm run dev).",
    "# Kept outside Git so Stripe keys and local DB preferences persist across fresh clones.",
    "",
  ];
  for (const [key, value] of Object.entries(saved)) {
    lines.push(`${key}=${formatEnvValue(value)}`);
  }
  lines.push("");

  fs.mkdirSync(path.dirname(localProfilePath), { recursive: true });
  fs.writeFileSync(localProfilePath, lines.join("\n"), { encoding: "utf8", mode: 0o600 });

  const keyNames = Object.keys(saved);
  logger.log(
    keyNames.length > 0
      ? `[setup] Saved ${keyNames.length} local preference(s) (${keyNames.join(", ")}) to ${localProfilePath}`
      : `[setup] Saved empty local preference profile to ${localProfilePath}`,
  );
  return { localProfilePath, keys: keyNames };
}

/**
 * Ensures .env, server/.env, and backend/.env exist, applies saved machine-local
 * preferences from ~/.mwb-local.env for empty/placeholder keys, and handles explicit
 * or auto-detected MySQL vs SQLite selection.
 */
export function ensureEnvFiles(rootDir, loggerOrOptions = console, maybeOptions = {}) {
  const isLogger =
    typeof loggerOrOptions?.log === "function" &&
    !Object.prototype.hasOwnProperty.call(loggerOrOptions, "logger");
  const logger = isLogger ? loggerOrOptions : (loggerOrOptions?.logger ?? console);
  const options = isLogger ? maybeOptions : (loggerOrOptions ?? {});
  const { dbMode = "auto", localProfilePath = getLocalProfilePath(), mysqlProbe } = options;

  const profileEntries = loadLocalProfileEntries(localProfilePath);

  const rootEnv = path.join(rootDir, ".env");
  const rootExample = path.join(rootDir, ".env.example");
  if (fs.existsSync(rootExample)) {
    const exampleBody = fs.readFileSync(rootExample, "utf8");
    const rootUpdates = filterUpdatesForTemplate(profileEntries, exampleBody, {
      extraPrefix: "VITE_",
    });
    const isNew = !fs.existsSync(rootEnv);
    const current = isNew ? exampleBody : fs.readFileSync(rootEnv, "utf8");
    const updated = upsertEnvValues(current, rootUpdates, { overwriteExisting: isNew });
    if (isNew || updated !== current) {
      fs.writeFileSync(rootEnv, updated, "utf8");
      logger.log(
        isNew
          ? "[setup] Created .env from .env.example"
          : "[setup] Applied local profile settings to .env",
      );
    }
  }

  const serverEnv = path.join(rootDir, "server", ".env");
  const serverExample = path.join(rootDir, "server", ".env.example");
  if (fs.existsSync(serverExample)) {
    const exampleBody = fs.readFileSync(serverExample, "utf8");
    const serverUpdates = filterUpdatesForTemplate(profileEntries, exampleBody);
    const isNew = !fs.existsSync(serverEnv);
    const current = isNew ? exampleBody : fs.readFileSync(serverEnv, "utf8");
    const updated = upsertEnvValues(current, serverUpdates, { overwriteExisting: isNew });
    if (isNew || updated !== current) {
      fs.writeFileSync(serverEnv, updated, "utf8");
      logger.log(
        isNew
          ? "[setup] Created server/.env from server/.env.example"
          : "[setup] Applied local profile settings to server/.env",
      );
    }
  }

  const backendEnv = path.join(rootDir, "backend", ".env");
  const backendExample = path.join(rootDir, "backend", ".env.example");
  if (fs.existsSync(backendExample)) {
    const exampleBody = fs.readFileSync(backendExample, "utf8");
    const backendUpdates = filterUpdatesForTemplate(profileEntries, exampleBody);
    const isNew = !fs.existsSync(backendEnv);

    let resolvedDbMode = dbMode;
    if (resolvedDbMode === "auto") {
      if (isNew) {
        if (profileEntries.DB_CONNECTION === "mysql" || profileEntries.DB_CONNECTION === "sqlite") {
          resolvedDbMode = profileEntries.DB_CONNECTION;
        } else if (typeof mysqlProbe === "function" && mysqlProbe(exampleBody)) {
          resolvedDbMode = "mysql";
        } else {
          resolvedDbMode = "sqlite";
        }
      }
    }

    const driverKeys = new Set(["DB_CONNECTION", ...MYSQL_ENV_KEYS]);
    const nonDriverUpdates = Object.fromEntries(
      Object.entries(backendUpdates).filter(([key]) => !driverKeys.has(key)),
    );

    if (isNew) {
      const base =
        resolvedDbMode === "mysql"
          ? buildLocalMysqlEnv(exampleBody)
          : buildLocalLaravelEnv(exampleBody);
      const updatesToApply = resolvedDbMode === "mysql" ? backendUpdates : nonDriverUpdates;
      const nextBody = upsertEnvValues(base, updatesToApply, { overwriteExisting: true });
      fs.writeFileSync(backendEnv, nextBody, "utf8");
      logger.log(
        resolvedDbMode === "mysql"
          ? "[setup] Created backend/.env (configured for local MySQL)"
          : "[setup] Created backend/.env (configured for local SQLite)",
      );
    } else {
      const current = fs.readFileSync(backendEnv, "utf8");
      let updated = current;
      if (dbMode === "mysql" || dbMode === "sqlite") {
        updated = switchBackendEnvDatabase(updated, dbMode, exampleBody);
      }

      const activeConnection =
        updated
          .match(/^DB_CONNECTION=(.*)$/m)?.[1]
          ?.trim()
          .replace(/^["']|["']$/g, "") ?? "";
      const isMysqlActive = activeConnection === "mysql";
      const updatesToApply = isMysqlActive ? backendUpdates : nonDriverUpdates;

      updated = upsertEnvValues(updated, updatesToApply, {
        overwriteExisting: dbMode === "mysql",
      });
      if (updated !== current) {
        fs.writeFileSync(backendEnv, updated, "utf8");
        logger.log(
          dbMode === "mysql" || dbMode === "sqlite"
            ? `[setup] Switched backend/.env to ${dbMode}`
            : "[setup] Applied local profile settings to backend/.env",
        );
      }
    }
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
export function runBootstrap({
  rootDir,
  postinstall = false,
  dbMode = "auto",
  localProfilePath = getLocalProfilePath(),
  logger = console,
} = {}) {
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

  const phpCmd = findPhpExecutable();
  ensureEnvFiles(rootDir, {
    logger,
    dbMode,
    localProfilePath,
    mysqlProbe: (exampleBody) => findReachableLocalMysql(phpCmd, exampleBody),
  });

  const backendDir = path.join(rootDir, "backend");
  ensureBackendDirectories(backendDir);

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

export function resolveDbModeFromArgs(argv = process.argv) {
  if (argv.includes("--mysql")) return "mysql";
  if (argv.includes("--sqlite")) return "sqlite";
  return "auto";
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  if (process.argv.includes("--save-local")) {
    saveLocalProfile(rootDir);
  } else {
    const postinstall = process.argv.includes("--postinstall");
    const dbMode = resolveDbModeFromArgs(process.argv);
    try {
      runBootstrap({ rootDir, postinstall, dbMode });
    } catch (error) {
      console.error(`[setup] ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}
