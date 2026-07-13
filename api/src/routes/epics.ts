import { FastifyInstance } from "fastify";
import { authGuard } from "../auth/guard";
import { createEpicSchema, updateEpicSchema } from "../schemas/epic";
import * as epicService from "../services/epicService";

export async function epicRoutes(app: FastifyInstance): Promise<void> {
  // Every epic route requires an authenticated, verified user.
  app.addHook("preHandler", authGuard);

  app.post("/epics", async (request, reply) => {
    const input = createEpicSchema.parse(request.body);
    const epic = await epicService.createEpic(input);
    reply.code(201);
    return { epic };
  });

  app.get("/epics", async (request) => {
    const { teamId } = request.query as { teamId?: string };
    const epics = await epicService.listEpics(teamId);
    return { epics };
  });

  app.get("/epics/:id", async (request) => {
    const { id } = request.params as { id: string };
    const epic = await epicService.getEpic(id);
    return { epic };
  });

  app.patch("/epics/:id", async (request) => {
    const { id } = request.params as { id: string };
    const input = updateEpicSchema.parse(request.body);
    const epic = await epicService.updateEpic(id, input);
    return { epic };
  });

  app.delete("/epics/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await epicService.deleteEpic(id);
    return reply.code(204).send();
  });
}
