import { Prisma, Ticket } from "@prisma/client";
import { prisma } from "../db";
import { badRequest, notFound } from "../errors";
import type {
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from "../schemas/ticket";

/** Throws 400 team_not_found unless the team exists. */
async function assertTeamExists(teamId: string): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });
  if (!team) throw badRequest("Team not found", "team_not_found");
}

/**
 * Validates that an epic (when set) exists and belongs to the given team.
 * Throws 400 epic_not_found / epic_team_mismatch otherwise. Assumes the team
 * has already been checked, so a missing team is reported as team_not_found
 * rather than being misattributed to the epic.
 */
async function assertEpicInTeam(
  epicId: string | null | undefined,
  teamId: string,
): Promise<void> {
  if (epicId == null) return;
  const epic = await prisma.epic.findUnique({ where: { id: epicId } });
  if (!epic) throw badRequest("Epic not found", "epic_not_found");
  if (epic.teamId !== teamId) {
    throw badRequest(
      "Epic does not belong to the ticket's team",
      "epic_team_mismatch",
    );
  }
}

export function listTickets(filters: ListTicketsQuery = {}): Promise<Ticket[]> {
  return prisma.ticket.findMany({
    where: {
      teamId: filters.teamId,
      type: filters.type,
      epicId: filters.epicId,
      // Search is title-only by spec (PLAN.md: "case-insensitive title search").
      title: filters.search
        ? { contains: filters.search, mode: "insensitive" }
        : undefined,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTicket(id: string): Promise<Ticket> {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw notFound("Ticket not found", "ticket_not_found");
  return ticket;
}

export async function createTicket(
  input: CreateTicketInput,
  userId: string,
): Promise<Ticket> {
  await assertTeamExists(input.teamId);
  await assertEpicInTeam(input.epicId, input.teamId);
  return prisma.ticket.create({
    data: {
      teamId: input.teamId,
      type: input.type,
      state: input.state ?? "new",
      title: input.title,
      body: input.body,
      epicId: input.epicId ?? null,
      createdById: userId,
    },
  });
}

export async function updateTicket(
  id: string,
  input: UpdateTicketInput,
): Promise<Ticket> {
  const existing = await getTicket(id); // 404 if missing

  const nextTeamId = input.teamId ?? existing.teamId;
  const nextEpicId =
    input.epicId !== undefined ? input.epicId : existing.epicId;
  // Validate the target team first (a missing team must report team_not_found,
  // not be misattributed to the epic below). Only when it actually changes.
  if (input.teamId !== undefined && input.teamId !== existing.teamId) {
    await assertTeamExists(input.teamId);
  }
  // The resulting (team, epic) pair must stay consistent, e.g. after a team
  // change that would strand an epic from the old team.
  await assertEpicInTeam(nextEpicId, nextTeamId);

  // Dirty-check: only advance modified_at when a field actually changes.
  const data: Prisma.TicketUncheckedUpdateInput = {};
  let changed = false;
  const apply = <T>(next: T, current: T, key: keyof Prisma.TicketUncheckedUpdateInput) => {
    if (next !== current) {
      (data as Record<string, unknown>)[key as string] = next;
      changed = true;
    }
  };

  if (input.type !== undefined) apply(input.type, existing.type, "type");
  if (input.state !== undefined) apply(input.state, existing.state, "state");
  if (input.title !== undefined) apply(input.title, existing.title, "title");
  if (input.body !== undefined) apply(input.body, existing.body, "body");
  apply(nextTeamId, existing.teamId, "teamId");
  apply(nextEpicId, existing.epicId, "epicId");

  if (!changed) return existing;

  data.modifiedAt = new Date();
  return prisma.ticket.update({ where: { id }, data });
}

export async function deleteTicket(id: string): Promise<void> {
  try {
    // Comments cascade via FK; ticket delete is never blocked.
    await prisma.ticket.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw notFound("Ticket not found", "ticket_not_found");
    }
    throw err;
  }
}
