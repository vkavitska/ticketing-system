import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(100),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(100),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
