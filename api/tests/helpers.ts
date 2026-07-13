import { randomUUID } from "node:crypto";
import { prisma } from "../src/db";
import { signAccessToken } from "../src/auth/jwt";

/**
 * Arrange a verified user and a matching bearer token, bypassing the email
 * verification flow (not under test here). Returns headers ready to spread
 * into an `app.inject` call.
 */
export async function createAuthedUser(): Promise<{
  userId: string;
  token: string;
  authHeader: { authorization: string };
}> {
  const user = await prisma.user.create({
    data: {
      email: `user-${randomUUID()}@example.com`,
      passwordHash: "not-a-real-hash",
      isVerified: true,
    },
  });
  const token = signAccessToken(user.id);
  return {
    userId: user.id,
    token,
    authHeader: { authorization: `Bearer ${token}` },
  };
}
