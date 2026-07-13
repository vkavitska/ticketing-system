import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { prisma } from "../src/db";
import { createAuthedUser } from "./helpers";

const app = buildApp();

let authHeader: { authorization: string };
let userId: string;

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    "TRUNCATE TABLE comments, tickets, epics, teams, email_verification_tokens, users RESTART IDENTITY CASCADE",
  );
  ({ authHeader, userId } = await createAuthedUser());
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

async function mkTeam(name: string): Promise<string> {
  const t = await prisma.team.create({ data: { name } });
  return t.id;
}
async function mkEpic(teamId: string, title: string): Promise<string> {
  const e = await prisma.epic.create({ data: { teamId, title } });
  return e.id;
}

const base = (teamId: string) => ({
  teamId,
  type: "bug",
  title: "Cannot log in",
  body: "Steps to reproduce…",
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function createTicket(payload: Record<string, unknown>) {
  const res = await app.inject({
    method: "POST",
    url: "/tickets",
    headers: authHeader,
    payload,
  });
  return res.json().ticket as {
    id: string;
    state: string;
    title: string;
    teamId: string;
    epicId: string | null;
    createdAt: string;
    modifiedAt: string;
  };
}

describe("tickets create + read", () => {
  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/tickets" });
    expect(res.statusCode).toBe(401);
  });

  it("creates a ticket with defaults and the current user as author", async () => {
    const teamId = await mkTeam("Alpha");
    const res = await app.inject({
      method: "POST",
      url: "/tickets",
      headers: authHeader,
      payload: base(teamId),
    });
    expect(res.statusCode).toBe(201);
    const ticket = res.json().ticket;
    expect(ticket.id).toBeTruthy();
    expect(ticket.state).toBe("new");
    expect(ticket.createdById).toBe(userId);
    expect(ticket.epicId).toBeNull();
    // Both timestamps come from the same INSERT → equal at creation.
    expect(ticket.modifiedAt).toBe(ticket.createdAt);
  });

  it("creates a ticket linked to an epic in the same team", async () => {
    const teamId = await mkTeam("Alpha");
    const epicId = await mkEpic(teamId, "Auth");
    const res = await app.inject({
      method: "POST",
      url: "/tickets",
      headers: authHeader,
      payload: { ...base(teamId), epicId },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().ticket.epicId).toBe(epicId);
  });

  it("rejects an epic that belongs to a different team (400)", async () => {
    const teamA = await mkTeam("Alpha");
    const teamB = await mkTeam("Beta");
    const epicB = await mkEpic(teamB, "Other");
    const res = await app.inject({
      method: "POST",
      url: "/tickets",
      headers: authHeader,
      payload: { ...base(teamA), epicId: epicB },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("epic_team_mismatch");
  });

  it("rejects an unknown type enum (400)", async () => {
    const teamId = await mkTeam("Alpha");
    const res = await app.inject({
      method: "POST",
      url: "/tickets",
      headers: authHeader,
      payload: { ...base(teamId), type: "chore" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a nonexistent team (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/tickets",
      headers: authHeader,
      payload: base(randomUUID()),
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a missing title (400)", async () => {
    const teamId = await mkTeam("Alpha");
    const { title: _omit, ...rest } = base(teamId);
    const res = await app.inject({
      method: "POST",
      url: "/tickets",
      headers: authHeader,
      payload: rest,
    });
    expect(res.statusCode).toBe(400);
  });

  it("reads a ticket by id and 404s for unknown", async () => {
    const teamId = await mkTeam("Alpha");
    const created = await app.inject({
      method: "POST",
      url: "/tickets",
      headers: authHeader,
      payload: base(teamId),
    });
    const id = created.json().ticket.id;
    const ok = await app.inject({
      method: "GET",
      url: `/tickets/${id}`,
      headers: authHeader,
    });
    expect(ok.statusCode).toBe(200);
    const missing = await app.inject({
      method: "GET",
      url: `/tickets/${randomUUID()}`,
      headers: authHeader,
    });
    expect(missing.statusCode).toBe(404);
  });
});

describe("tickets list + filters", () => {
  async function seed() {
    const teamA = await mkTeam("Alpha");
    const teamB = await mkTeam("Beta");
    const epicA = await mkEpic(teamA, "Auth");
    const post = (payload: Record<string, unknown>) =>
      app.inject({ method: "POST", url: "/tickets", headers: authHeader, payload });
    await post({ ...base(teamA), type: "bug", title: "Login broken", epicId: epicA });
    await post({ ...base(teamA), type: "feature", title: "Dark mode" });
    await post({ ...base(teamB), type: "bug", title: "Payments fail" });
    return { teamA, teamB, epicA };
  }

  const list = async (qs: string) => {
    const res = await app.inject({
      method: "GET",
      url: `/tickets${qs}`,
      headers: authHeader,
    });
    return res.json().tickets as Array<{ title: string; teamId: string; type: string; epicId: string | null }>;
  };

  it("filters by teamId", async () => {
    const { teamA } = await seed();
    const rows = await list(`?teamId=${teamA}`);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.teamId === teamA)).toBe(true);
  });

  it("filters by type", async () => {
    await seed();
    const rows = await list(`?type=bug`);
    expect(rows.map((r) => r.title).sort()).toEqual(["Login broken", "Payments fail"]);
  });

  it("filters by epicId", async () => {
    const { epicA } = await seed();
    const rows = await list(`?epicId=${epicA}`);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Login broken");
  });

  it("searches title case-insensitively", async () => {
    await seed();
    const rows = await list(`?search=LOGIN`);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Login broken");
  });

  it("combines filters with AND", async () => {
    const { teamA } = await seed();
    const rows = await list(`?teamId=${teamA}&type=bug`);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Login broken");
  });
});

describe("tickets update + delete", () => {
  const patch = (id: string, payload: Record<string, unknown>) =>
    app.inject({
      method: "PATCH",
      url: `/tickets/${id}`,
      headers: authHeader,
      payload,
    });

  it("advances modified_at when the state changes", async () => {
    const teamId = await mkTeam("Alpha");
    const ticket = await createTicket(base(teamId));
    await sleep(10);
    const res = await patch(ticket.id, { state: "in_progress" });
    expect(res.statusCode).toBe(200);
    const updated = res.json().ticket;
    expect(updated.state).toBe("in_progress");
    expect(new Date(updated.modifiedAt).getTime()).toBeGreaterThan(
      new Date(ticket.modifiedAt).getTime(),
    );
  });

  it("does NOT advance modified_at on a no-op save", async () => {
    const teamId = await mkTeam("Alpha");
    const ticket = await createTicket(base(teamId));
    await sleep(10);
    const res = await patch(ticket.id, {
      title: ticket.title,
      state: ticket.state,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ticket.modifiedAt).toBe(ticket.modifiedAt);
  });

  it("rejects an unknown state enum (400)", async () => {
    const teamId = await mkTeam("Alpha");
    const ticket = await createTicket(base(teamId));
    const res = await patch(ticket.id, { state: "archived" });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a team change that leaves an incompatible epic (400)", async () => {
    const teamA = await mkTeam("Alpha");
    const teamB = await mkTeam("Beta");
    const epicA = await mkEpic(teamA, "Auth");
    const ticket = await createTicket({ ...base(teamA), epicId: epicA });
    // Move ticket to team B without updating its epic (still epicA in team A).
    const res = await patch(ticket.id, { teamId: teamB });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("epic_team_mismatch");
  });

  it("404s when patching an unknown ticket", async () => {
    const res = await patch(randomUUID(), { state: "done" });
    expect(res.statusCode).toBe(404);
  });

  it("deletes a ticket, then 404 on re-fetch", async () => {
    const teamId = await mkTeam("Alpha");
    const ticket = await createTicket(base(teamId));
    const del = await app.inject({
      method: "DELETE",
      url: `/tickets/${ticket.id}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(204);
    const get = await app.inject({
      method: "GET",
      url: `/tickets/${ticket.id}`,
      headers: authHeader,
    });
    expect(get.statusCode).toBe(404);
  });

  it("404s when deleting an unknown ticket", async () => {
    const del = await app.inject({
      method: "DELETE",
      url: `/tickets/${randomUUID()}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(404);
  });
});
