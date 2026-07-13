import { z } from "zod";

export const ticketType = z.enum(["bug", "feature", "fix"]);
export const ticketState = z.enum([
  "new",
  "ready_for_implementation",
  "in_progress",
  "ready_for_acceptance",
  "done",
]);

export const createTicketSchema = z.object({
  teamId: z.string().uuid("A valid team id is required"),
  type: ticketType,
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Body is required").max(10000),
  epicId: z.string().uuid().nullable().optional(),
  state: ticketState.optional(),
});

export const updateTicketSchema = z.object({
  teamId: z.string().uuid().optional(),
  type: ticketType.optional(),
  state: ticketState.optional(),
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  body: z.string().trim().min(1, "Body is required").max(10000).optional(),
  epicId: z.string().uuid().nullable().optional(),
});

export const listTicketsQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
  type: ticketType.optional(),
  epicId: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(10000),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
