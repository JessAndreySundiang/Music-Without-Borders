// Runs the Vite dev server (web), the Laravel CMS API (cms), the Stripe
// donation API (api), and optionally the Stripe CLI forwarder together after
// bootstrapping missing dependencies, .env files, and local SQLite setup.
//
// Usage: npm run dev
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isPlaceholderStripeSecret,
  readEnvValue,
  resolveDbModeFromArgs,
  runBootstrap,
} from "./bootstrap.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.join(root, "backend");
const isWindows = process.platform === "win32";

/**
 * Probes an HTTP health endpoint so already-running background services are
 * reused cleanly instead of failing on EADDRINUSE.
 */
async function isHealthy(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(800) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Locates the Stripe CLI, returning null when absent so the site, CMS, and
 * unconfigured donate page all still work smoothly.
 */
function findStripeCli() {
  try {
    const probe = spawnSync("stripe --version", {
      encoding: "utf8",
      shell: true,
    });
    return probe.status === 0 ? "stripe" : null;
  } catch {
    return null;
  }
}

let bootstrapResult;
try {
  bootstrapResult = runBootstrap({
    rootDir: root,
    postinstall: false,
    dbMode: resolveDbModeFromArgs(process.argv),
  });
} catch (error) {
  console.error(`[setup] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const [cmsAlreadyUp, apiAlreadyUp] = await Promise.all([
  isHealthy("http://127.0.0.1:8000/api/health"),
  isHealthy("http://127.0.0.1:4242/health"),
]);

const targets = [
  {
    label: "web",
    color: "\x1b[36m",
    command: process.execPath,
    args: ["node_modules/vite/bin/vite.js"],
    cwd: root,
  },
];

if (apiAlreadyUp) {
  console.log("\x1b[35m[api]\x1b[0m Donation API already running at http://localhost:4242");
} else {
  targets.push({
    label: "api",
    color: "\x1b[35m",
    command: process.execPath,
    args: ["server/server.js"],
    cwd: root,
  });
}

if (cmsAlreadyUp) {
  console.log("\x1b[32m[cms]\x1b[0m Laravel CMS API already running at http://127.0.0.1:8000");
} else if (bootstrapResult.backendReady && bootstrapResult.phpCmd) {
  targets.push({
    label: "cms",
    color: "\x1b[32m",
    command: bootstrapResult.phpCmd,
    args: ["artisan", "serve", "--host=127.0.0.1", "--port=8000"],
    cwd: backendDir,
  });
}

const serverStripeSecret = readEnvValue(path.join(root, "server", ".env"), "STRIPE_SECRET_KEY");
if (isPlaceholderStripeSecret(serverStripeSecret)) {
  console.log(
    "\x1b[33m[stripe]\x1b[0m Using placeholder Stripe keys — public site & CMS work normally; " +
      "add test keys in .env and server/.env to test card checkout.",
  );
} else {
  const stripeCli = findStripeCli();
  if (stripeCli) {
    targets.push({
      label: "stripe",
      color: "\x1b[33m",
      command:
        "stripe listen --forward-to localhost:4242/stripe-webhook --events payment_intent.succeeded",
      args: undefined,
      cwd: root,
      optional: true,
    });
  } else {
    const prefix = "\x1b[33m[stripe]\x1b[0m";
    console.log(`${prefix} The Stripe CLI was not found, so donations will not be recorded`);
    console.log(`${prefix} and no donation email will be sent. Install it, then restart:`);
    console.log(
      `${prefix}   stripe listen --forward-to localhost:4242/stripe-webhook --events payment_intent.succeeded`,
    );
  }
}

// Exit code 1 from server/server.js means it rejected its configuration.
const CONFIG_ERROR = 1;

const alive = new Set();
let shuttingDown = false;

function killChildTree(child) {
  if (!child.pid) return;
  if (isWindows) {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of alive) killChildTree(child);
  process.exit(code);
}

for (const { label, color, command, args, cwd, optional } of targets) {
  const child = args
    ? spawn(command, args, {
        cwd: cwd ?? root,
        env: process.env,
      })
    : spawn(command, {
        cwd: cwd ?? root,
        env: process.env,
        shell: true,
      });
  alive.add(child);

  const prefix = (line) => `${color}[${label}]\x1b[0m ${line}`;

  for (const stream of [child.stdout, child.stderr]) {
    let buffer = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) console.log(prefix(line));
    });
  }

  child.on("error", (err) => {
    console.log(prefix(`could not start: ${err.message}`));
  });

  child.on("exit", (code) => {
    alive.delete(child);

    // Stopping on purpose (Ctrl+C or a sibling shutting down) is not a failure.
    if (shuttingDown) return;

    if (code === 0) {
      console.log(prefix("stopped"));
    } else {
      console.log(prefix(`stopped unexpectedly (exit code ${code ?? "unknown"})`));
    }

    if (label === "api") {
      console.log(
        prefix(
          code === CONFIG_ERROR
            ? "The API could not start: check STRIPE_SECRET_KEY in server/.env (sk_test_... or sk_live_...)."
            : "The donation form will not work until the API is listening on port 4242 again.",
        ),
      );
    }

    if (label === "cms") {
      console.log(
        prefix(
          "The CMS API stopped on port 8000. Public pages may show loading errors until it restarts.",
        ),
      );
    }

    if (optional) {
      console.log(
        prefix(
          "Donations will still go through at Stripe, but they will not be recorded and no email will be sent.",
        ),
      );
      console.log(prefix("Try: stripe login   then restart npm run dev."));
    }

    if (alive.size === 0) shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
