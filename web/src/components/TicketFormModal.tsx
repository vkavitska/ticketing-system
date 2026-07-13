import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "./Modal";
import { useToast } from "./Toast";
import { ui } from "../lib/ui";
import { typeLabel } from "../lib/format";
import {
  TICKET_TYPES,
  createTicket,
  type Ticket,
  type TicketType,
} from "../api/tickets";
import type { Epic } from "../api/epics";
import type { ApiError } from "../lib/api";

interface Props {
  teamId: string;
  teamName: string;
  epics: Epic[];
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
}

export default function TicketFormModal({
  teamId,
  teamName,
  epics,
  onClose,
  onCreated,
}: Props) {
  const [type, setType] = useState<TicketType>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [epicId, setEpicId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      createTicket({
        teamId,
        type,
        title: title.trim(),
        body: body.trim(),
        epicId: epicId || null,
      }),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket created");
      onCreated(ticket);
    },
    onError: (err) => {
      setError(
        (err as unknown as ApiError).message ??
          "Something went wrong. Try again.",
      );
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Title is required.");
    if (!body.trim()) return setError("Body is required.");
    mutation.mutate();
  }

  return (
    <Modal title="New ticket" onClose={onClose} description={`Team: ${teamName}`}>
      <form onSubmit={onSubmit} noValidate>
        <label className={ui.label} htmlFor="ticket-title">
          Title
        </label>
        <input
          id="ticket-title"
          className={ui.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "ticket-error" : undefined}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className={ui.label} htmlFor="ticket-type">
              Type
            </label>
            <select
              id="ticket-type"
              className={ui.select}
              value={type}
              onChange={(e) => setType(e.target.value as TicketType)}
            >
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ui.label} htmlFor="ticket-epic">
              Epic <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              id="ticket-epic"
              className={ui.select}
              value={epicId}
              onChange={(e) => setEpicId(e.target.value)}
            >
              <option value="">None</option>
              {epics.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className={ui.label} htmlFor="ticket-body">
          Body
        </label>
        <textarea
          id="ticket-body"
          className={`${ui.input} min-h-[6rem] resize-y`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe the work…"
        />

        {error && (
          <p id="ticket-error" role="alert" className={ui.statusError}>
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={ui.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={ui.btnPrimary}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating…" : "Create ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
