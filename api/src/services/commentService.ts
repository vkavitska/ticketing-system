import { Comment, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { notFound } from "../errors";
import { getTicket } from "./ticketService";

export async function listComments(ticketId: string): Promise<Comment[]> {
  // Reuse the ticket 404 contract rather than re-implementing it.
  await getTicket(ticketId);
  return prisma.comment.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Adds a comment. Intentionally does NOT touch the ticket's modified_at —
 * per spec, commenting is not a change to the ticket itself. A missing ticket
 * surfaces as the insert's FK violation (P2003), avoiding an extra round-trip.
 */
export async function addComment(
  ticketId: string,
  authorId: string,
  body: string,
): Promise<Comment> {
  try {
    return await prisma.comment.create({ data: { ticketId, authorId, body } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      throw notFound("Ticket not found", "ticket_not_found");
    }
    throw err;
  }
}
