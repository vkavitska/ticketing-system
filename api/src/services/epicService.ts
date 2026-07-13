import { Epic, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { badRequest, conflict, notFound } from "../errors";

export function listEpics(teamId?: string): Promise<Epic[]> {
  return prisma.epic.findMany({
    where: teamId ? { teamId } : undefined,
    orderBy: { createdAt: "asc" },
  });
}

export async function getEpic(id: string): Promise<Epic> {
  const epic = await prisma.epic.findUnique({ where: { id } });
  if (!epic) throw notFound("Epic not found", "epic_not_found");
  return epic;
}

export async function createEpic(input: {
  teamId: string;
  title: string;
  description?: string | null;
}): Promise<Epic> {
  try {
    return await prisma.epic.create({ data: input });
  } catch (err) {
    // FK RESTRICT on epics.team_id → referenced team does not exist.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      throw badRequest("Team not found", "team_not_found");
    }
    throw err;
  }
}

export async function updateEpic(
  id: string,
  input: { teamId?: string; title?: string; description?: string | null },
): Promise<Epic> {
  const existing = await getEpic(id); // 404 if missing

  if (input.teamId !== undefined && input.teamId !== existing.teamId) {
    throw conflict(
      "Epic team cannot be changed after creation",
      "team_immutable",
    );
  }

  const data: Prisma.EpicUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;

  return prisma.epic.update({ where: { id }, data });
}

export async function deleteEpic(id: string): Promise<void> {
  try {
    await prisma.epic.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw notFound("Epic not found", "epic_not_found");
      // FK RESTRICT on tickets.epic_id → related tickets exist.
      if (err.code === "P2003") {
        throw conflict(
          "Epic has related tickets and cannot be deleted",
          "epic_has_dependents",
        );
      }
    }
    throw err;
  }
}
