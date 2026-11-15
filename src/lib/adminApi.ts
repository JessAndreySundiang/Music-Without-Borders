import { API_BASE_URL } from "./api";
import type {
  AdminLoginResponse,
  AdminMeResponse,
  AdminPageResponse,
  AdminPerformance,
  AdminSettingsResponse,
  AdminStory,
  AdminTestimonial,
  AdminUser,
  ItemUpdate,
  PageKey,
  PerformanceDraft,
  SectionUpdate,
  StoryDraft,
  TestimonialDraft,
} from "../types/Admin";

const TOKEN_KEY = "mwb-admin-token";

export class AdminApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getAdminToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage can be unavailable in private browsing */
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

async function adminRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    errors?: Record<string, string[]>;
  } | null;

  if (!response.ok) {
    if (response.status === 401) setAdminToken(null);

    throw new AdminApiError(
      payload?.message ?? `Request failed (HTTP ${response.status}).`,
      response.status,
      payload?.errors ?? {},
    );
  }

  return payload as T;
}

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const response = await adminRequest<AdminLoginResponse>("/admin/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });

  setAdminToken(response.data.token);
  return response.data.user;
}

export async function fetchAdminMe(): Promise<AdminUser> {
  const response = await adminRequest<AdminMeResponse>("/admin/me");
  return response.data;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await adminRequest<{ message: string }>("/admin/logout", { method: "POST" });
  } finally {
    setAdminToken(null);
  }
}

export async function requestAdminReset(email: string): Promise<string> {
  const response = await adminRequest<{ message: string }>("/admin/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
  });
  return response.message;
}

export async function resetAdminPassword(payload: {
  email: string;
  token: string;
  expires: string;
  signature: string;
  password: string;
  password_confirmation: string;
}): Promise<string> {
  const response = await adminRequest<{ message: string }>("/admin/reset-password", {
    method: "POST",
    auth: false,
    body: { ...payload, expires: Number(payload.expires) },
  });
  return response.message;
}

export async function fetchAdminPage(page: PageKey): Promise<AdminPageResponse["data"]> {
  const response = await adminRequest<AdminPageResponse>(`/admin/${page}`);
  return response.data;
}

export async function updateAdminSection(
  page: PageKey,
  id: number,
  payload: SectionUpdate,
): Promise<void> {
  await adminRequest(`/admin/${page}/sections/${id}`, { method: "PATCH", body: payload });
}

export async function updateAdminItem(
  page: PageKey,
  id: number,
  payload: ItemUpdate,
): Promise<void> {
  await adminRequest(`/admin/${page}/items/${id}`, { method: "PATCH", body: payload });
}

export async function reorderAdminSections(page: PageKey, ids: number[]): Promise<void> {
  await adminRequest(`/admin/${page}/sections/reorder`, { method: "PUT", body: { ids } });
}

export async function reorderAdminItems(page: PageKey, ids: number[]): Promise<void> {
  await adminRequest(`/admin/${page}/items/reorder`, { method: "PUT", body: { ids } });
}

export async function fetchAdminSettings(): Promise<Record<string, string>> {
  const response = await adminRequest<AdminSettingsResponse>("/admin/settings");
  return response.data;
}

export async function updateAdminSettings(settings: Record<string, string>): Promise<void> {
  await adminRequest("/admin/settings", { method: "PATCH", body: { settings } });
}

export async function fetchAdminPerformances(): Promise<AdminPerformance[]> {
  const response = await adminRequest<{ data: AdminPerformance[] }>("/admin/performances");
  return response.data;
}

export async function createAdminPerformance(payload: PerformanceDraft): Promise<AdminPerformance> {
  const response = await adminRequest<{ data: AdminPerformance }>("/admin/performances", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateAdminPerformance(
  id: number,
  payload: PerformanceDraft,
): Promise<AdminPerformance> {
  const response = await adminRequest<{ data: AdminPerformance }>(`/admin/performances/${id}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function deleteAdminPerformance(id: number): Promise<void> {
  await adminRequest(`/admin/performances/${id}`, { method: "DELETE" });
}

export async function fetchAdminTestimonials(): Promise<AdminTestimonial[]> {
  const response = await adminRequest<{ data: AdminTestimonial[] }>("/admin/testimonials");
  return response.data;
}

export async function createAdminTestimonial(payload: TestimonialDraft): Promise<AdminTestimonial> {
  const response = await adminRequest<{ data: AdminTestimonial }>("/admin/testimonials", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateAdminTestimonial(
  id: number,
  payload: TestimonialDraft,
): Promise<AdminTestimonial> {
  const response = await adminRequest<{ data: AdminTestimonial }>(`/admin/testimonials/${id}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function deleteAdminTestimonial(id: number): Promise<void> {
  await adminRequest(`/admin/testimonials/${id}`, { method: "DELETE" });
}

export async function fetchAdminStories(): Promise<AdminStory[]> {
  const response = await adminRequest<{ data: AdminStory[] }>("/admin/stories");
  return response.data;
}

export async function createAdminStory(payload: StoryDraft): Promise<AdminStory> {
  const response = await adminRequest<{ data: AdminStory }>("/admin/stories", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateAdminStory(id: number, payload: StoryDraft): Promise<AdminStory> {
  const response = await adminRequest<{ data: AdminStory }>(`/admin/stories/${id}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function deleteAdminStory(id: number): Promise<void> {
  await adminRequest(`/admin/stories/${id}`, { method: "DELETE" });
}
