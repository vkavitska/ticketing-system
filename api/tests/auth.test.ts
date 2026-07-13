import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the email service so no SMTP is required. We capture the raw token
// passed to it to drive the verification step.
const { sendVerificationEmailMock } = vi.hoisted(() => ({
  sendVerificationEmailMock: vi.fn<(email: string, token: string) => Promise<void>>(),
}));
vi.mock("../src/services/emailService", () => ({
  sendVerificationEmail: sendVerificationEmailMock,
}));

import { buildApp } from "../src/app";
import { prisma } from "../src/db";

const app = buildApp();

beforeEach(async () => {
  sendVerificationEmailMock.mockReset();
  sendVerificationEmailMock.mockResolvedValue(undefined);
  await prisma.$executeRawUnsafe(
    "TRUNCATE TABLE comments, tickets, epics, teams, email_verification_tokens, users RESTART IDENTITY CASCADE",
  );
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

function lastToken(): string {
  const calls = sendVerificationEmailMock.mock.calls;
  return calls[calls.length - 1][1];
}

describe("auth business flow", () => {
  it("signup -> verify -> login -> /me, and blocks unverified login", async () => {
    // Sign up (mixed case + whitespace exercises email normalization).
    const signup = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "  Alice@Example.COM ", password: "password123" },
    });
    expect(signup.statusCode).toBe(201);

    const user = await prisma.user.findFirstOrThrow();
    expect(user.email).toBe("alice@example.com");
    expect(user.isVerified).toBe(false);
    expect(user.passwordHash).not.toContain("password123");
    expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);

    // Login before verification is forbidden.
    const early = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "alice@example.com", password: "password123" },
    });
    expect(early.statusCode).toBe(403);

    // Verify with the raw token captured from the email.
    const token = lastToken();
    const verify = await app.inject({
      method: "GET",
      url: `/auth/verify?token=${token}`,
    });
    expect(verify.statusCode).toBe(200);
    expect(verify.json()).toMatchObject({ status: "verified" });

    // Single-use: verifying again fails.
    const reuse = await app.inject({
      method: "GET",
      url: `/auth/verify?token=${token}`,
    });
    expect(reuse.statusCode).toBe(400);

    // Login now succeeds and returns a bearer token.
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "alice@example.com", password: "password123" },
    });
    expect(login.statusCode).toBe(200);
    const bearer = login.json().token as string;
    expect(bearer).toBeTruthy();

    // /me requires the token.
    const meUnauth = await app.inject({ method: "GET", url: "/me" });
    expect(meUnauth.statusCode).toBe(401);

    const me = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${bearer}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe("alice@example.com");
  });

  it("rejects a duplicate email with 409", async () => {
    const payload = { email: "dup@example.com", password: "password123" };
    const first = await app.inject({ method: "POST", url: "/auth/signup", payload });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({ method: "POST", url: "/auth/signup", payload });
    expect(second.statusCode).toBe(409);
  });

  it("rejects a too-short password with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "short@example.com", password: "short" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("reissuing a verification token invalidates the previous one", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "reissue@example.com", password: "password123" },
    });
    const firstToken = lastToken();

    const resend = await app.inject({
      method: "POST",
      url: "/auth/resend-verification",
      payload: { email: "reissue@example.com" },
    });
    expect(resend.statusCode).toBe(200);
    const secondToken = lastToken();
    expect(secondToken).not.toBe(firstToken);

    // Old token no longer works; new one does.
    const oldVerify = await app.inject({
      method: "GET",
      url: `/auth/verify?token=${firstToken}`,
    });
    expect(oldVerify.statusCode).toBe(400);

    const newVerify = await app.inject({
      method: "GET",
      url: `/auth/verify?token=${secondToken}`,
    });
    expect(newVerify.statusCode).toBe(200);
  });
});
