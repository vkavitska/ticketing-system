import { describe, it, expect, vi, beforeEach } from "vitest";
import { listTickets } from "./tickets";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ tickets: [] }),
    })),
  );
});

const calledUrl = () =>
  (fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as string;

describe("listTickets query building", () => {
  it("sends no query string when there are no filters", async () => {
    await listTickets();
    expect(calledUrl()).toBe("/api/tickets");
  });

  it("includes only provided filters, url-encoded", async () => {
    await listTickets({ teamId: "t1", type: "bug", search: "log in" });
    const url = calledUrl();
    expect(url.startsWith("/api/tickets?")).toBe(true);
    const qs = new URLSearchParams(url.split("?")[1]);
    expect(qs.get("teamId")).toBe("t1");
    expect(qs.get("type")).toBe("bug");
    expect(qs.get("search")).toBe("log in");
    expect(qs.get("epicId")).toBeNull();
  });

  it("unwraps the tickets array from the envelope", async () => {
    await expect(listTickets()).resolves.toEqual([]);
  });
});
