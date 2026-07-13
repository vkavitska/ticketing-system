import { FastifyInstance } from "fastify";
import { authGuard } from "../auth/guard";
import {
  createCommentSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "../schemas/ticket";
import * as ticketService from "../services/ticketService";
import * as commentService from "../services/commentService";

export async function ticketRoutes(app: FastifyInstance): Promise<void> {
  // Every ticket route requires an authenticated, verified user.
  app.addHook("preHandler", authGuard);

  app.post("/tickets", async (request, reply) => {
    const input = createTicketSchema.parse(request.body);
    const ticket = await ticketService.createTicket(input, request.user!.id);
    reply.code(201);
    return { ticket };
  });

  app.get("/tickets", async (request) => {
    const filters = listTicketsQuerySchema.parse(request.query);
    const tickets = await ticketService.listTickets(filters);
    return { tickets };
  });

  app.get("/tickets/:id", async (request) => {
    const { id } = request.params as { id: string };
    const ticket = await ticketService.getTicket(id);
    return { ticket };
  });

  app.patch("/tickets/:id", async (request) => {
    const { id } = request.params as { id: string };
    const input = updateTicketSchema.parse(request.body);
    const ticket = await ticketService.updateTicket(id, input);
    return { ticket };
  });

  app.delete("/tickets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await ticketService.deleteTicket(id);
    return reply.code(204).send();
  });

  app.get("/tickets/:id/comments", async (request) => {
    const { id } = request.params as { id: string };
    const comments = await commentService.listComments(id);
    return { comments };
  });

  app.post("/tickets/:id/comments", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { body } = createCommentSchema.parse(request.body);
    const comment = await commentService.addComment(id, request.user!.id, body);
    reply.code(201);
    return { comment };
  });
}
