import { z } from "zod";

export const createEpicSchema = z.object({
  teamId: z.string().uuid("A valid team id is required"),
  title: z.string().trim().min(1, "Epic title is required").max(200),
  description: z.string().trim().max(5000).nullable().optional(),
});

export const updateEpicSchema = z.object({
  // Accepted so the service can reject a *changed* team with 409
  // (epic team is immutable after creation).
  teamId: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Epic title is required").max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
});

export type CreateEpicInput = z.infer<typeof createEpicSchema>;
export type UpdateEpicInput = z.infer<typeof updateEpicSchema>;
