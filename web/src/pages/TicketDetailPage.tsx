import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import CommentsPanel from "../components/CommentsPanel";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { useToast } from "../components/Toast";
import { useAuth } from "../lib/auth";
import { ui } from "../lib/ui";
import { stateLabel, typeLabel, formatDateTime } from "../lib/format";
import { listTeams } from "../api/teams";
import { listEpics } from "../api/epics";
import {
  TICKET_STATES,
  TICKET_TYPES,
  deleteTicket,
  getTicket,
  updateTicket,
  type TicketState,
  type TicketType,
} from "../api/tickets";
import type { ApiError } from "../lib/api";

export default function TicketDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  const ticketQuery = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(id),
    retry: false,
  });
  const teamsQuery = useQuery({ queryKey: ["teams"], queryFn: listTeams });
  const epicsQuery = useQuery({ queryKey: ["epics"], queryFn: () => listEpics() });

  const ticket = ticketQuery.data;
  const teams = teamsQuery.data ?? [];
  const epics = useMemo(() => epicsQuery.data ?? [], [epicsQuery.data]);

  const [type, setType] = useState<TicketType>("bug");
  const [state, setState] = useState<TicketState>("new");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [epicId, setEpicId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  // Seed the edit form once the ticket loads.
  useEffect(() => {
    if (!ticket) return;
    setType(ticket.type);
    setState(ticket.state);
    setTitle(ticket.title);
    setBody(ticket.body);
    setEpicId(ticket.epicId ?? "");
  }, [ticket]);

  const save = useMutation({
    mutationFn: () =>
      updateTicket(id, {
        type,
        state,
        title: title.trim(),
        body: body.trim(),
        epicId: epicId || null,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["ticket", id], updated);
      qc.invalidateQueries({ queryKey: ["tickets"] });
      setError(null);
      toast.success("Ticket saved");
    },
    onError: (err) => {
      setError((err as unknown as ApiError).message ?? "Couldn’t save. Try again.");
    },
  });

  function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Title is required.");
    if (!body.trim()) return setError("Body is required.");
    save.mutate();
  }

  const teamName = ticket
    ? (teams.find((t) => t.id === ticket.teamId)?.name ?? "—")
    : "";
  const teamEpics = ticket ? epics.filter((e) => e.teamId === ticket.teamId) : [];
  const authorLabel = ticket
    ? ticket.createdById === user?.id
      ? "You"
      : `User ${ticket.createdById.slice(0, 8)}`
    : "";

  const notFound =
    ticketQuery.isError &&
    (ticketQuery.error as unknown as ApiError)?.status === 404;

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link className={`${ui.link} text-sm`} to="/tickets">
          ← Back to tickets
        </Link>

        {ticketQuery.isPending && (
          <p className="mt-6 text-sm text-slate-500">Loading ticket…</p>
        )}

        {notFound && (
          <div className={`${ui.panel} mt-6 p-8 text-center`}>
            <p className="text-sm font-medium text-slate-900">Ticket not found</p>
            <p className="mt-1 text-sm text-slate-500">
              It may have been deleted.
            </p>
          </div>
        )}

        {ticketQuery.isError && !notFound && (
          <div className="mt-6">
            <p className={ui.statusError}>Couldn’t load the ticket.</p>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSm} mt-3`}
              onClick={() => ticketQuery.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {ticket && (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_20rem]">
            {/* Edit form */}
            <form onSubmit={onSave} noValidate className={`${ui.panel} p-5`}>
              <label className={ui.label} htmlFor="d-title">
                Title
              </label>
              <input
                id="d-title"
                className={ui.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "detail-error" : undefined}
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className={ui.label} htmlFor="d-type">
                    Type
                  </label>
                  <select
                    id="d-type"
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
                  <label className={ui.label} htmlFor="d-state">
                    State
                  </label>
                  <select
                    id="d-state"
                    className={ui.select}
                    value={state}
                    onChange={(e) => setState(e.target.value as TicketState)}
                  >
                    {TICKET_STATES.map((s) => (
                      <option key={s} value={s}>
                        {stateLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className={ui.label} htmlFor="d-epic">
                    Epic
                  </label>
                  <select
                    id="d-epic"
                    className={ui.select}
                    value={epicId}
                    onChange={(e) => setEpicId(e.target.value)}
                  >
                    <option value="">None</option>
                    {teamEpics.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={ui.label} htmlFor="d-team">
                    Team
                  </label>
                  <input
                    id="d-team"
                    className={`${ui.input} bg-slate-50 text-slate-500`}
                    value={teamName}
                    readOnly
                  />
                </div>
              </div>

              <label className={ui.label} htmlFor="d-body">
                Body
              </label>
              <textarea
                id="d-body"
                className={`${ui.input} min-h-[8rem] resize-y`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />

              {error && (
                <p id="detail-error" role="alert" className={ui.statusError}>
                  {error}
                </p>
              )}

              <p className="mt-4 text-xs text-slate-400">
                Created {formatDateTime(ticket.createdAt)} by {authorLabel} · Last
                modified {formatDateTime(ticket.modifiedAt)}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  className={ui.btnDanger}
                  onClick={() => setShowDelete(true)}
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className={ui.btnPrimary}
                  disabled={save.isPending}
                >
                  {save.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>

            <CommentsPanel ticketId={ticket.id} currentUserId={user?.id} />
          </div>
        )}
      </main>

      {showDelete && ticket && (
        <ConfirmDeleteModal
          title={`Delete ticket “${ticket.title}”?`}
          description="This also removes its comments and can’t be undone."
          confirmLabel="Delete ticket"
          successMessage="Ticket deleted"
          onConfirm={async () => {
            await deleteTicket(ticket.id);
            qc.invalidateQueries({ queryKey: ["tickets"] });
            navigate("/tickets");
          }}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
