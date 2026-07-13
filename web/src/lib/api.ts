const TOKEN_KEY = "tt_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

/**
 * Typed fetch wrapper. Prefixes `/api` (proxied to the backend by nginx in prod
 * and by Vite in dev), attaches the bearer token, and normalizes error bodies
 * into a thrown `ApiError`.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = (data && data.error) || {};
    throw {
      status: res.status,
      code: err.code ?? "error",
      message: err.message ?? `Request failed (${res.status})`,
      details: err.details,
    } as ApiError;
  }
  return data as T;
}
