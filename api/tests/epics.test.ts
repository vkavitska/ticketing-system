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

async function createTeam(name: string): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/teams",
    headers: authHeader,
    payload: { name },
  });
  return res.json().team.id as string;
}

async function createEpic(teamId: string, title: string): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/epics",
    headers: authHeader,
    payload: { teamId, title },
  });
  return res.json().epic.id as string;
}

describe("epics CRUD", () => {
  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/epics" });
    expect(res.statusCode).toBe(401);
  });

  it("creates an epic under a team", async () => {
    const teamId = await createTeam("Alpha");
    const res = await app.inject({
      method: "POST",
      url: "/epics",
      headers: authHeader,
      payload: { teamId, title: "Login flow", description: "auth epic" },
    });
    expect(res.statusCode).toBe(201);
    const epic = res.json().epic;
    expect(epic.id).toBeTruthy();
    expect(epic.teamId).toBe(teamId);
    expect(epic.title).toBe("Login flow");
  });

  it("rejects a blank title with 400", async () => {
    const teamId = await createTeam("Alpha");
    const res = await app.inject({
      method: "POST",
      url: "/epics",
      headers: authHeader,
      payload: { teamId, title: "  " },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects creating an epic for a nonexistent team with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/epics",
      headers: authHeader,
      payload: { teamId: randomUUID(), title: "Orphan" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("lists epics and filters by teamId", async () => {
    const teamA = await createTeam("Alpha");
    const teamB = await createTeam("Beta");
    await createEpic(teamA, "A1");
    await createEpic(teamA, "A2");
    await createEpic(teamB, "B1");

    const all = await app.inject({
      method: "GET",
      url: "/epics",
      headers: authHeader,
    });
    expect(all.json().epics).toHaveLength(3);

    const onlyA = await app.inject({
      method: "GET",
      url: `/epics?teamId=${teamA}`,
      headers: authHeader,
    });
    expect(onlyA.json().epics).toHaveLength(2);
    expect(
      onlyA.json().epics.every((e: { teamId: string }) => e.teamId === teamA),
    ).toBe(true);
  });

  it("returns 404 for an unknown epic id", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/epics/${randomUUID()}`,
      headers: authHeader,
    });
    expect(res.statusCode).toBe(404);
  });

  it("updates an epic's title and description", async () => {
    const teamId = await createTeam("Alpha");
    const id = await createEpic(teamId, "Old");
    const res = await app.inject({
      method: "PATCH",
      url: `/epics/${id}`,
      headers: authHeader,
      payload: { title: "New", description: "updated" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().epic.title).toBe("New");
    expect(res.json().epic.description).toBe("updated");
  });

  it("refuses to change an epic's team after creation (409)", async () => {
    const teamA = await createTeam("Alpha");
    const teamB = await createTeam("Beta");
    const id = await createEpic(teamA, "E1");

    const res = await app.inject({
      method: "PATCH",
      url: `/epics/${id}`,
      headers: authHeader,
      payload: { teamId: teamB },
    });
    expect(res.statusCode).toBe(409);

    // Team must be unchanged.
    const after = await app.inject({
      method: "GET",
      url: `/epics/${id}`,
      headers: authHeader,
    });
    expect(after.json().epic.teamId).toBe(teamA);
  });

  it("deletes an epic with no tickets, then 404 on re-fetch", async () => {
    const teamId = await createTeam("Alpha");
    const id = await createEpic(teamId, "E1");
    const del = await app.inject({
      method: "DELETE",
      url: `/epics/${id}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(204);
    const get = await app.inject({
      method: "GET",
      url: `/epics/${id}`,
      headers: authHeader,
    });
    expect(get.statusCode).toBe(404);
  });

  it("refuses to delete an epic that has a ticket (409)", async () => {
    const teamId = await createTeam("Alpha");
    const id = await createEpic(teamId, "E1");
    await prisma.ticket.create({
      data: {
        teamId,
        epicId: id,
        type: "bug",
        title: "T1",
        body: "body",
        createdById: userId,
      },
    });
    const del = await app.inject({
      method: "DELETE",
      url: `/epics/${id}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(409);
  });

  it("returns 404 when deleting an unknown epic", async () => {
    const del = await app.inject({
      method: "DELETE",
      url: `/epics/${randomUUID()}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(404);
  });
});
