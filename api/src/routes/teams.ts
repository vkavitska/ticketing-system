import { FastifyInstance } from "fastify";
import { authGuard } from "../auth/guard";
import { createTeamSchema, updateTeamSchema } from "../schemas/team";
import * as teamService from "../services/teamService";

export async function teamRoutes(app: FastifyInstance): Promise<void> {
  // Every team route requires an authenticated, verified user.
  app.addHook("preHandler", authGuard);

  app.post("/teams", async (request, reply) => {
    const { name } = createTeamSchema.parse(request.body);
    const team = await teamService.createTeam(name);
    reply.code(201);
    return { team };
  });

  app.get("/teams", async () => {
    const teams = await teamService.listTeams();
    return { teams };
  });

  app.get("/teams/:id", async (request) => {
    const { id } = request.params as { id: string };
    const team = await teamService.getTeam(id);
    return { team };
  });

  app.patch("/teams/:id", async (request) => {
    const { id } = request.params as { id: string };
    const { name } = updateTeamSchema.parse(request.body);
    const team = await teamService.updateTeam(id, name);
    return { team };
  });

  app.delete("/teams/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await teamService.deleteTeam(id);
    return reply.code(204).send();
  });
}
