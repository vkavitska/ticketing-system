import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { verifyAccessToken } from "./jwt";
import { forbidden, unauthorized } from "../errors";

// Augment Fastify's request with the authenticated user.
declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string; email: string };
  }
}

/**
 * preHandler that enforces a valid bearer token for a verified user.
 * Attach to any route that requires authentication.
 */
export async function authGuard(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw unauthorized();
  }

  const token = header.slice("Bearer ".length).trim();
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw unauthorized("Invalid or expired token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw unauthorized("Invalid or expired token");
  }
  if (!user.isVerified) {
    throw forbidden("Email address is not verified", "email_not_verified");
  }

  request.user = { id: user.id, email: user.email };
}
