import { Prisma, Team } from "@prisma/client";
import { prisma } from "../db";
import { conflict, notFound } from "../errors";

export function listTeams(): Promise<Team[]> {
  return prisma.team.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getTeam(id: string): Promise<Team> {
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) throw notFound("Team not found", "team_not_found");
  return team;
}

export async function createTeam(name: string): Promise<Team> {
  try {
    return await prisma.team.create({ data: { name } });
  } catch (err) {
    // Case-insensitive unique index (teams_name_lower_key) → 409.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw conflict("A team with this name already exists", "name_taken");
    }
    throw err;
  }
}

export async function updateTeam(id: string, name: string): Promise<Team> {
  try {
    return await prisma.team.update({ where: { id }, data: { name } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw notFound("Team not found", "team_not_found");
      if (err.code === "P2002") {
        throw conflict("A team with this name already exists", "name_taken");
      }
    }
    throw err;
  }
}

export async function deleteTeam(id: string): Promise<void> {
  try {
    await prisma.team.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw notFound("Team not found", "team_not_found");
      // FK RESTRICT on epics.team_id / tickets.team_id → related rows exist.
      if (err.code === "P2003") {
        throw conflict(
          "Team has related epics or tickets and cannot be deleted",
          "team_has_dependents",
        );
      }
    }
    throw err;
  }
}
