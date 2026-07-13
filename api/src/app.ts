import Fastify, { FastifyInstance } from "fastify";
import { prisma } from "./db";

/**
 * Builds the Fastify application. Kept separate from the server bootstrap so
 * tests can construct the app without binding to a port.
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
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

  return app;
}
