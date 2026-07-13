import { Prisma, User } from "@prisma/client";
import { prisma } from "../db";
import { hashPassword, verifyPassword } from "../auth/password";
import { conflict } from "../errors";

/** Emails are trimmed and lowercased so uniqueness/comparison is case-insensitive. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(email: string, password: string): Promise<User> {
  const normalized = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  try {
    return await prisma.user.create({
      data: { email: normalized, passwordHash },
    });
  } catch (err) {
    // Unique constraint violation -> email already registered.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw conflict("An account with this email already exists", "email_taken");
    }
    throw err;
  }
}

export function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
}

/** Returns the user if the password matches, otherwise null. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await findByEmail(email);
  if (!user) return null;
  const ok = await verifyPassword(user.passwordHash, password);
  return ok ? user : null;
}
