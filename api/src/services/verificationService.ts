import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../db";
import { config } from "../config";

/** Only the hash of a token is stored; the raw token is emailed to the user. */
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Issues a fresh verification token for a user, invalidating any earlier
 * unused tokens. Returns the raw token to be emailed.
 */
export async function issueToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + config.verificationTokenTtlMs);

  await prisma.$transaction([
    // Invalidate prior unused tokens for this user.
    prisma.emailVerificationToken.deleteMany({
      where: { userId, consumedAt: null },
    }),
    prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  return raw;
}

export type VerifyResult = "verified" | "expired" | "invalid";

/**
 * Consumes a verification token: single-use, must be unexpired. On success the
 * associated user is marked verified.
 */
export async function consumeToken(raw: string): Promise<VerifyResult> {
  const tokenHash = hashToken(raw);
  const record = await prisma.emailVerificationToken.findFirst({
    where: { tokenHash },
  });

  if (!record || record.consumedAt) return "invalid";
  if (record.expiresAt.getTime() < Date.now()) return "expired";

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { isVerified: true },
    }),
  ]);

  return "verified";
}
