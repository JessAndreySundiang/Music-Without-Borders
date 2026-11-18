import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  ADMIN_UNAUTHORIZED_EVENT,
  fetchAdminMe,
  getAdminToken,
  loginAdmin,
  logoutAdmin,
  setAdminToken,
} from "./adminApi";
import {
  AdminAuthContext,
  useAdminAuth,
  type AdminAuthStatus,
  type AdminAuthValue,
} from "./adminAuthContext";
import type { AdminUser } from "../types/Admin";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminAuthStatus>(() =>
    getAdminToken() ? "loading" : "anonymous",
  );
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!getAdminToken()) return;

    let cancelled = false;

    fetchAdminMe()
      .then((admin) => {
        if (cancelled) return;
        setUser(admin);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setAdminToken(null);
        setUser(null);
        setStatus("anonymous");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 from any authenticated request means the 8-hour token expired or was
  // revoked. Drop the session immediately so RequireAdmin can return the editor
  // to sign-in instead of leaving a dashboard full of failed requests.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus("anonymous");
    };

    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const admin = await loginAdmin(email, password);
    setUser(admin);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div
        className="grid min-h-screen place-items-center bg-paper"
        role="status"
        data-state="checking-session"
      >
        <div className="text-center">
          <span className="mx-auto block size-10 animate-spin rounded-full border-2 border-line border-t-brass" />
          <p className="mt-4 text-sm font-semibold text-muted">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
