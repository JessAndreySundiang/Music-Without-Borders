import { createContext, useContext } from "react";
import type { AdminUser } from "../types/Admin";

export type AdminAuthStatus = "loading" | "authenticated" | "anonymous";

export interface AdminAuthValue {
  status: AdminAuthStatus;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function useAdminAuth(): AdminAuthValue {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  return value;
}
