import { apiFetch } from "../lib/api";

export interface AuthUser {
  id: string;
  email: string;
}

export function signup(email: string, password: string) {
  return apiFetch<{ message: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function resendVerification(email: string) {
  return apiFetch<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getMe() {
  return apiFetch<{ user: AuthUser }>("/me");
}

export type VerifyStatus = "verified" | "expired" | "invalid";

/**
 * The verify endpoint returns the outcome in the body for both success (200)
 * and expired/invalid (400), so we read the status regardless of HTTP code.
 */
export async function verifyEmail(token: string): Promise<VerifyStatus> {
  const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
  const data = (await res.json().catch(() => ({}))) as { status?: VerifyStatus };
  return data.status ?? "invalid";
}
