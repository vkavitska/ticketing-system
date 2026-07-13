/** Human-readable label for a ticket state enum ("in_progress" → "In progress"). */
export function stateLabel(state: string): string {
  const spaced = state.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Human-readable label for a ticket type enum ("bug" → "Bug"). */
export function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Locale date-time for timestamps, e.g. "13 Jul 2026, 16:40". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
