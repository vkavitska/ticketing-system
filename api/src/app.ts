import Fastify, { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { AppError } from "./errors";
import { authRoutes } from "./routes/auth";
import { teamRoutes } from "./routes/teams";
import { epicRoutes } from "./routes/epics";
import { ticketRoutes } from "./routes/tickets";

/**
 * Builds the Fastify application. Kept separate from the server bootstrap so
 * tests can construct the app (and use `inject`) without binding to a port.
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    // Quiet logs during tests.
    logger: process.env.NODE_ENV !== "test",
  });

  // Consistent error envelope: { error: { code, message, details? } }
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400);
      return reply.send({
        error: {
          code: "validation_error",
          message: "Validation failed",
          details: error.flatten().fieldErrors,
        },
      });
    }
    if (error instanceof AppError) {
      reply.code(error.statusCode);
      return reply.send({
        error: { code: error.code, message: error.message },
      });
    }
    // A malformed path param against a uuid column (e.g. GET /tickets/abc)
    // surfaces as P2023 — treat it as a missing resource, not a 500.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2023"
    ) {
      reply.code(404);
      return reply.send({
        error: { code: "not_found", message: "Resource not found" },
      });
    }
    request.log.error(error);
    reply.code(500);
    return reply.send({
      error: { code: "internal_error", message: "Internal server error" },
    });
  });

  // Liveness: process is up. Public (no auth) per spec.
  app.get("/health", async () => {
    return { status: "ok" };
  });

  // Readiness: can we reach the database? Public per spec.
  app.get("/health/ready", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch (err) {
      app.log.error(err, "readiness check failed");
      reply.code(503);
      return { status: "not-ready" };
    }
  });

  // Authentication routes (signup/verify/resend/login are public; /me is guarded).
  app.register(authRoutes);

  // Teams CRUD (all routes require authentication).
  app.register(teamRoutes);

  // Epics CRUD (all routes require authentication).
  app.register(epicRoutes);

  // Tickets + comments (all routes require authentication).
  app.register(ticketRoutes);

  return app;
}
