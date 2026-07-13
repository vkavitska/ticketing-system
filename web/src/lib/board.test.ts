import { describe, it, expect } from "vitest";
import { groupTicketsByState } from "./board";
import type { Ticket } from "../api/tickets";

const make = (over: Partial<Ticket>): Ticket => ({
  id: "x",
  teamId: "t1",
  epicId: null,
  type: "bug",
  state: "new",
  title: "T",
  body: "b",
  createdById: "u1",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("groupTicketsByState", () => {
  it("buckets tickets into their state columns", () => {
    const g = groupTicketsByState([
      make({ id: "a", state: "new" }),
      make({ id: "b", state: "done" }),
      make({ id: "c", state: "new" }),
    ]);
    expect(g.new.map((t) => t.id)).toEqual(["a", "c"]);
    expect(g.done.map((t) => t.id)).toEqual(["b"]);
    expect(g.in_progress).toEqual([]);
  });

  it("sorts each column by modifiedAt descending", () => {
    const g = groupTicketsByState([
      make({ id: "old", modifiedAt: "2026-01-01T00:00:00.000Z" }),
      make({ id: "new", modifiedAt: "2026-03-01T00:00:00.000Z" }),
      make({ id: "mid", modifiedAt: "2026-02-01T00:00:00.000Z" }),
    ]);
    expect(g.new.map((t) => t.id)).toEqual(["new", "mid", "old"]);
  });

  it("always returns all five columns, even when empty", () => {
    const g = groupTicketsByState([]);
    expect(Object.keys(g).sort()).toEqual([
      "done",
      "in_progress",
      "new",
      "ready_for_acceptance",
      "ready_for_implementation",
    ]);
  });
});
