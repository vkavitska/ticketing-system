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

async function createTeam(name: string): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/teams",
    headers: authHeader,
    payload: { name },
  });
  return res.json().team.id as string;
}

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("teams CRUD", () => {
  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/teams" });
    expect(res.statusCode).toBe(401);
  });

  it("creates a team and lists it", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/teams",
      headers: authHeader,
      payload: { name: "Alpha" },
    });
    expect(create.statusCode).toBe(201);
    const team = create.json().team;
    expect(team.id).toBeTruthy();
    expect(team.name).toBe("Alpha");

    const list = await app.inject({
      method: "GET",
      url: "/teams",
      headers: authHeader,
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().teams).toHaveLength(1);
    expect(list.json().teams[0].name).toBe("Alpha");
  });

  it("rejects a blank name with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/teams",
      headers: authHeader,
      payload: { name: "   " },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a duplicate name with 409", async () => {
    const payload = { name: "Alpha" };
    const first = await app.inject({
      method: "POST",
      url: "/teams",
      headers: authHeader,
      payload,
    });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: "POST",
      url: "/teams",
      headers: authHeader,
      payload,
    });
    expect(second.statusCode).toBe(409);
  });

  it("treats team names as unique case-insensitively", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/teams",
      headers: authHeader,
      payload: { name: "Alpha" },
    });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: "POST",
      url: "/teams",
      headers: authHeader,
      payload: { name: "  alpha  " },
    });
    expect(second.statusCode).toBe(409);
  });

  it("returns 404 for an unknown team id", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/teams/${randomUUID()}`,
      headers: authHeader,
    });
    expect(res.statusCode).toBe(404);
  });

  it("renames a team", async () => {
    const id = await createTeam("Alpha");
    const res = await app.inject({
      method: "PATCH",
      url: `/teams/${id}`,
      headers: authHeader,
      payload: { name: "Beta" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().team.name).toBe("Beta");
  });

  it("rejects a rename that collides case-insensitively with 409", async () => {
    await createTeam("Alpha");
    const id = await createTeam("Beta");
    const res = await app.inject({
      method: "PATCH",
      url: `/teams/${id}`,
      headers: authHeader,
      payload: { name: "ALPHA" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("deletes a team with no relations, then 404 on re-fetch", async () => {
    const id = await createTeam("Alpha");
    const del = await app.inject({
      method: "DELETE",
      url: `/teams/${id}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(204);
    const get = await app.inject({
      method: "GET",
      url: `/teams/${id}`,
      headers: authHeader,
    });
    expect(get.statusCode).toBe(404);
  });

  it("refuses to delete a team that has an epic (409)", async () => {
    const id = await createTeam("Alpha");
    await prisma.epic.create({ data: { teamId: id, title: "Epic 1" } });
    const del = await app.inject({
      method: "DELETE",
      url: `/teams/${id}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(409);
  });

  it("refuses to delete a team that has a ticket (409)", async () => {
    const id = await createTeam("Alpha");
    await prisma.ticket.create({
      data: {
        teamId: id,
        type: "bug",
        title: "T1",
        body: "body",
        createdById: userId,
      },
    });
    const del = await app.inject({
      method: "DELETE",
      url: `/teams/${id}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(409);
  });

  it("returns 404 when deleting an unknown team", async () => {
    const del = await app.inject({
      method: "DELETE",
      url: `/teams/${randomUUID()}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(404);
  });
});
