import { apiFetch } from "../lib/api";

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export function listComments(ticketId: string) {
  return apiFetch<{ comments: Comment[] }>(`/tickets/${ticketId}/comments`).then(
    (r) => r.comments,
  );
}

export function addComment(ticketId: string, body: string) {
  return apiFetch<{ comment: Comment }>(`/tickets/${ticketId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  }).then((r) => r.comment);
}
