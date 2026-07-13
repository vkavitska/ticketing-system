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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function createTicket() {
  const team = await prisma.team.create({ data: { name: "Alpha" } });
  const res = await app.inject({
    method: "POST",
    url: "/tickets",
    headers: authHeader,
    payload: { teamId: team.id, type: "bug", title: "Bug", body: "b" },
  });
  return res.json().ticket as { id: string; modifiedAt: string };
}

function postComment(ticketId: string, body: unknown) {
  return app.inject({
    method: "POST",
    url: `/tickets/${ticketId}/comments`,
    headers: authHeader,
    payload: { body },
  });
}

describe("comments", () => {
  it("adds a comment authored by the current user", async () => {
    const ticket = await createTicket();
    const res = await postComment(ticket.id, "First!");
    expect(res.statusCode).toBe(201);
    const comment = res.json().comment;
    expect(comment.body).toBe("First!");
    expect(comment.authorId).toBe(userId);
    expect(comment.ticketId).toBe(ticket.id);
  });

  it("lists comments oldest-first", async () => {
    const ticket = await createTicket();
    await postComment(ticket.id, "one");
    await sleep(10);
    await postComment(ticket.id, "two");

    const res = await app.inject({
      method: "GET",
      url: `/tickets/${ticket.id}/comments`,
      headers: authHeader,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().comments.map((c: { body: string }) => c.body)).toEqual([
      "one",
      "two",
    ]);
  });

  it("does NOT advance the ticket's modified_at when a comment is added", async () => {
    const ticket = await createTicket();
    await sleep(10);
    await postComment(ticket.id, "does not touch the ticket");

    const res = await app.inject({
      method: "GET",
      url: `/tickets/${ticket.id}`,
      headers: authHeader,
    });
    expect(res.json().ticket.modifiedAt).toBe(ticket.modifiedAt);
  });

  it("404s when commenting on an unknown ticket", async () => {
    const res = await postComment(randomUUID(), "hello");
    expect(res.statusCode).toBe(404);
  });

  it("404s (not 500) for a malformed ticket id on the comments endpoints", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/tickets/not-a-uuid/comments",
      headers: authHeader,
    });
    expect(list.statusCode).toBe(404);
    const post = await postComment("not-a-uuid", "hi");
    expect(post.statusCode).toBe(404);
  });

  it("rejects an empty comment body (400)", async () => {
    const ticket = await createTicket();
    const res = await postComment(ticket.id, "   ");
    expect(res.statusCode).toBe(400);
  });

  it("cascades: deleting a ticket removes its comments", async () => {
    const ticket = await createTicket();
    await postComment(ticket.id, "bye");

    const del = await app.inject({
      method: "DELETE",
      url: `/tickets/${ticket.id}`,
      headers: authHeader,
    });
    expect(del.statusCode).toBe(204);

    // The ticket is gone, so its comments endpoint 404s…
    const list = await app.inject({
      method: "GET",
      url: `/tickets/${ticket.id}/comments`,
      headers: authHeader,
    });
    expect(list.statusCode).toBe(404);
    // …and no comment rows remain.
    expect(await prisma.comment.count()).toBe(0);
  });
});
