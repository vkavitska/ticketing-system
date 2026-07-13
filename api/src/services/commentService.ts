import { Comment } from "@prisma/client";
import { prisma } from "../db";
import { notFound } from "../errors";

async function ensureTicketExists(ticketId: string): Promise<void> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) throw notFound("Ticket not found", "ticket_not_found");
}

export async function listComments(ticketId: string): Promise<Comment[]> {
  await ensureTicketExists(ticketId);
  return prisma.comment.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Adds a comment. Intentionally does NOT touch the ticket's modified_at —
 * per spec, commenting is not a change to the ticket itself.
 */
export async function addComment(
  ticketId: string,
  authorId: string,
  body: string,
): Promise<Comment> {
  await ensureTicketExists(ticketId);
  return prisma.comment.create({ data: { ticketId, authorId, body } });
}
