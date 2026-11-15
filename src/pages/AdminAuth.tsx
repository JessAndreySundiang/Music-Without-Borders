import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { IconArrowLeft, IconLock, IconMusic, IconShieldCheck } from "../components/Icons";
import { requestAdminReset, resetAdminPassword } from "../lib/adminApi";
import { useAdminAuth } from "../lib/adminAuthContext";
import { usePageTitle } from "../lib/usePageTitle";
import logo from "../assets/logo.svg";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20";
const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-muted";
const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-brass-bright px-5 py-3.5 text-sm font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

function AdminAuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="stage relative isolate hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_32px,var(--stage-staff)_32px_34px)]" />
          <div className="absolute -left-24 top-1/3 size-80 rounded-full bg-amber-400/10 blur-3xl" />
        </div>
        <Link to="/" className="flex items-center gap-3 text-stage-fg">
          <span className="grid size-12 place-items-center rounded-full border border-medal-ring bg-gradient-to-br from-medal-from to-medal-to">
            <img src={logo} alt="" className="size-7" />
          </span>
          <span className="font-serif text-xl font-semibold">Community Music Band</span>
        </Link>
        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brass">CMS workspace</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-balance text-stage-fg">
            Keep the bandstand in tune, one note at a time.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stage-muted">
            Update the page copy, publish performances, and share stories without touching SQL.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-stage-line-strong bg-stage-glass-strong p-4 text-sm text-stage-muted">
          <IconShieldCheck className="size-5 shrink-0 text-brass" />
          Administrator-only area. Sessions use expiring bearer tokens.
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-brass lg:hidden"
          >
            <img src={logo} alt="" className="size-7 rounded-full bg-night-950 p-1" />
            Community Music Band
          </Link>

          <div className="rounded-3xl border border-line bg-surface p-7 shadow-xl sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-brass">
              <IconLock className="size-3.5" />
              {eyebrow}
            </span>
            <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-5 rounded-xl border border-plume/30 bg-plume/10 px-4 py-3 text-sm text-plume"
    >
      {message}
    </div>
  );
}

export function AdminLoginPage() {
  usePageTitle("Admin sign in");
  const { status, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("Communitymusicband@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "authenticated") {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith("/admin") ? from : "/admin", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminAuthShell
      eyebrow="Admin sign in"
      title="Welcome back to the bandstand."
      description="Sign in to manage the public site, performances, testimonials, and Stories."
    >
      <FormError message={error} />
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="admin-email" className={labelClass}>
            Email address
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="admin-password" className={labelClass}>
              Password
            </label>
            <Link
              to="/admin/forgot-password"
              className="mb-2 text-xs font-bold text-brass transition-colors hover:text-plume"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? "Signing in…" : "Sign in to the CMS"}
        </button>
      </form>
      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <IconMusic className="mt-0.5 size-4 shrink-0 text-brass" />
        The first-time setup link is written to the backend's private storage folder. It is never
        printed in the browser or terminal.
      </p>
    </AdminAuthShell>
  );
}

export function AdminForgotPasswordPage() {
  usePageTitle("Reset admin password");
  const [email, setEmail] = useState("Communitymusicband@gmail.com");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      setMessage(await requestAdminReset(email));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to prepare a reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminAuthShell
      eyebrow="Password help"
      title="A one-time link, not a password in an inbox."
      description="Enter the administrator email. If it matches, a signed reset link is prepared for local delivery."
    >
      <FormError message={error} />
      {message ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-brass/30 bg-brass/10 px-4 py-3 text-sm leading-relaxed text-body">
            {message}
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4 text-sm leading-relaxed text-muted">
            <p className="font-bold text-ink">Where is the link?</p>
            <p className="mt-1">
              On this local install, open{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-ink">
                backend/storage/app/private/admin-reset-link.txt
              </code>
              . The link expires in 60 minutes and can only be used once.
            </p>
          </div>
          <Link to="/admin/login" className={primaryButton}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="reset-email" className={labelClass}>
              Administrator email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Preparing link…" : "Prepare a reset link"}
          </button>
          <Link
            to="/admin/login"
            className="inline-flex w-full items-center justify-center gap-2 text-xs font-bold text-muted transition-colors hover:text-brass"
          >
            <IconArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </form>
      )}
    </AdminAuthShell>
  );
}

export function AdminResetPasswordPage() {
  usePageTitle("Choose a new password");
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const expires = params.get("expires") ?? "";
  const signature = params.get("signature") ?? "";
  const validLink = Boolean(email && token && expires && signature);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmation) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      setMessage(
        await resetAdminPassword({
          email,
          token,
          expires,
          signature,
          password,
          password_confirmation: confirmation,
        }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminAuthShell
      eyebrow="New password"
      title="Choose something only you know."
      description="Use at least 10 characters. The link can be used once, then it stops working."
    >
      <FormError message={error} />
      {!validLink ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-plume/30 bg-plume/10 px-4 py-3 text-sm text-plume">
            This reset link is incomplete. Ask the site maintainer for a fresh one.
          </div>
          <Link to="/admin/forgot-password" className={primaryButton}>
            Request a new link
          </Link>
        </div>
      ) : message ? (
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-xl border border-brass/30 bg-brass/10 px-4 py-3 text-sm leading-relaxed text-body"
          >
            {message}
          </div>
          <Link to="/admin/login" className={primaryButton}>
            Sign in with the new password
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">
            Resetting the password for <strong className="text-ink">{email}</strong>.
          </div>
          <div>
            <label htmlFor="new-password" className={labelClass}>
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Updating password…" : "Save new password"}
          </button>
        </form>
      )}
    </AdminAuthShell>
  );
}
