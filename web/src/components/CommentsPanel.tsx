import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./Toast";
import { ui } from "../lib/ui";
import { formatDateTime } from "../lib/format";
import { addComment, listComments } from "../api/comments";
import type { ApiError } from "../lib/api";

interface Props {
  ticketId: string;
  currentUserId: string | undefined;
}

function authorLabel(authorId: string, currentUserId: string | undefined) {
  if (authorId === currentUserId) return "You";
  return `User ${authorId.slice(0, 8)}`;
}

export default function CommentsPanel({ ticketId, currentUserId }: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: ["comments", ticketId],
    queryFn: () => listComments(ticketId),
  });

  const mutation = useMutation({
    mutationFn: () => addComment(ticketId, body.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", ticketId] });
      setBody("");
      toast.success("Comment added");
    },
    onError: (err) => {
      setError(
        (err as unknown as ApiError).message ?? "Couldn’t add comment. Try again.",
      );
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return setError("Comment can’t be empty.");
    mutation.mutate();
  }

  const comments = query.data ?? [];

  return (
    <section className={`${ui.panel} flex flex-col`} aria-label="Comments">
      <header className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Comments
        </h2>
      </header>

      <div className="flex-1 p-4">
        {query.isPending && (
          <p className="text-sm text-slate-500">Loading comments…</p>
        )}
        {query.isError && (
          <div>
            <p className={ui.statusError}>Couldn’t load comments.</p>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSm} mt-3`}
              onClick={() => query.refetch()}
            >
              Retry
            </button>
          </div>
        )}
        {!query.isPending && !query.isError && comments.length === 0 && (
          <p className="text-sm text-slate-500">No comments yet.</p>
        )}
        {comments.length > 0 && (
          <ul className="flex flex-col gap-4">
            {comments.map((c) => (
              <li key={c.id}>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {authorLabel(c.authorId, currentUserId)}
                  </span>{" "}
                  · {formatDateTime(c.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={onSubmit} noValidate className="border-t border-slate-200 p-4">
        <label className="sr-only" htmlFor="new-comment">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          className={`${ui.input} min-h-[3.5rem] resize-y`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "comment-error" : undefined}
        />
        {error && (
          <p id="comment-error" role="alert" className={ui.statusError}>
            {error}
          </p>
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            className={`${ui.btnPrimary} ${ui.btnSm}`}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>
    </section>
  );
}
