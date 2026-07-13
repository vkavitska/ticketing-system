import { apiFetch } from "../lib/api";

export const TICKET_TYPES = ["bug", "feature", "fix"] as const;
export const TICKET_STATES = [
  "new",
  "ready_for_implementation",
  "in_progress",
  "ready_for_acceptance",
  "done",
] as const;

export type TicketType = (typeof TICKET_TYPES)[number];
export type TicketState = (typeof TICKET_STATES)[number];

export interface Ticket {
  id: string;
  teamId: string;
  epicId: string | null;
  type: TicketType;
  state: TicketState;
  title: string;
  body: string;
  createdById: string;
  createdAt: string;
  modifiedAt: string;
}

export interface TicketFilters {
  teamId?: string;
  type?: TicketType;
  epicId?: string;
  search?: string;
}

export function listTickets(filters: TicketFilters = {}) {
  const qs = new URLSearchParams();
  if (filters.teamId) qs.set("teamId", filters.teamId);
  if (filters.type) qs.set("type", filters.type);
  if (filters.epicId) qs.set("epicId", filters.epicId);
  if (filters.search) qs.set("search", filters.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ tickets: Ticket[] }>(`/tickets${suffix}`).then((r) => r.tickets);
}

export function getTicket(id: string) {
  return apiFetch<{ ticket: Ticket }>(`/tickets/${id}`).then((r) => r.ticket);
}

export function createTicket(input: {
  teamId: string;
  type: TicketType;
  title: string;
  body: string;
  epicId?: string | null;
}) {
  return apiFetch<{ ticket: Ticket }>("/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.ticket);
}

export function updateTicket(
  id: string,
  input: Partial<{
    type: TicketType;
    state: TicketState;
    title: string;
    body: string;
    epicId: string | null;
  }>,
) {
  return apiFetch<{ ticket: Ticket }>(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((r) => r.ticket);
}

export function deleteTicket(id: string) {
  return apiFetch<null>(`/tickets/${id}`, { method: "DELETE" });
}
