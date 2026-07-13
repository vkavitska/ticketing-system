import { TICKET_STATES, type Ticket, type TicketState } from "../api/tickets";

/**
 * Groups tickets into the five board columns, each sorted by modified_at
 * descending (most-recently-changed first). Pure — the board derives its
 * columns from this over the React Query result.
 */
export function groupTicketsByState(
  tickets: Ticket[],
): Record<TicketState, Ticket[]> {
  const byState = Object.fromEntries(
    TICKET_STATES.map((s) => [s, [] as Ticket[]]),
  ) as Record<TicketState, Ticket[]>;

  for (const ticket of tickets) {
    byState[ticket.state]?.push(ticket);
  }
  for (const state of TICKET_STATES) {
    byState[state].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  }
  return byState;
}
