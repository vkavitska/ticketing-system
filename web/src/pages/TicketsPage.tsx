import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import TicketFormModal from "../components/TicketFormModal";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Skeleton from "../components/Skeleton";
import { StateBadge, TypeBadge } from "../components/Badge";
import { ui } from "../lib/ui";
import { typeLabel, formatDateTime } from "../lib/format";
import { listTeams } from "../api/teams";
import { listEpics } from "../api/epics";
import {
  TICKET_TYPES,
  listTickets,
  type TicketFilters,
  type TicketType,
} from "../api/tickets";

/** Debounce a rapidly-changing value (e.g. the search box). */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function TicketsPage() {
  const navigate = useNavigate();

  const [teamId, setTeamId] = useState("");
  const [type, setType] = useState("");
  const [epicId, setEpicId] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const debouncedSearch = useDebounced(search, 300);

  const teamsQuery = useQuery({ queryKey: ["teams"], queryFn: listTeams });
  const epicsQuery = useQuery({ queryKey: ["epics"], queryFn: () => listEpics() });
  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const epics = useMemo(() => epicsQuery.data ?? [], [epicsQuery.data]);

  // Default to the first team; reset the epic filter when the team changes.
  useEffect(() => {
    if (teams.length && !teams.some((t) => t.id === teamId)) {
      setTeamId(teams[0].id);
      setEpicId("");
    }
  }, [teams, teamId]);

  const teamEpics = useMemo(
    () => epics.filter((e) => e.teamId === teamId),
    [epics, teamId],
  );
  const epicTitle = (id: string | null) =>
    id ? (epics.find((e) => e.id === id)?.title ?? "—") : "—";

  const filters: TicketFilters = {
    teamId: teamId || undefined,
    type: (type || undefined) as TicketType | undefined,
    epicId: epicId || undefined,
    search: debouncedSearch || undefined,
  };
  const ticketsQuery = useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => listTickets(filters),
    enabled: Boolean(teamId),
  });
  const tickets = ticketsQuery.data ?? [];
  const selectedTeam = teams.find((t) => t.id === teamId) ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Tickets</h1>
          <button
            type="button"
            className={ui.btnPrimary}
            onClick={() => setShowCreate(true)}
            disabled={!selectedTeam}
          >
            + New ticket
          </button>
        </div>

        {teams.length === 0 && !teamsQuery.isPending ? (
          <div className={ui.panel}>
            <EmptyState
              title="No teams yet"
              description="Create a team on the Teams tab before adding tickets."
            />
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              <div>
                <label className={ui.label} htmlFor="f-team">
                  Team
                </label>
                <select
                  id="f-team"
                  className={ui.select}
                  value={teamId}
                  onChange={(e) => {
                    setTeamId(e.target.value);
                    setEpicId("");
                  }}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label} htmlFor="f-type">
                  Type
                </label>
                <select
                  id="f-type"
                  className={ui.select}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="">All types</option>
                  {TICKET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {typeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label} htmlFor="f-epic">
                  Epic
                </label>
                <select
                  id="f-epic"
                  className={ui.select}
                  value={epicId}
                  onChange={(e) => setEpicId(e.target.value)}
                >
                  <option value="">All epics</option>
                  {teamEpics.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      {ep.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label} htmlFor="f-search">
                  Search
                </label>
                <input
                  id="f-search"
                  className={ui.input}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Title contains…"
                  type="search"
                />
              </div>
            </div>

            <div className={`${ui.panel} p-2`}>
              {ticketsQuery.isPending && (
                <div aria-busy="true" className="flex flex-col gap-1 p-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full" />
                  ))}
                </div>
              )}
              {ticketsQuery.isError && (
                <ErrorState
                  message="Couldn’t load tickets."
                  onRetry={() => ticketsQuery.refetch()}
                />
              )}
              {!ticketsQuery.isPending &&
                !ticketsQuery.isError &&
                tickets.length === 0 && (
                  <EmptyState
                    title="No tickets"
                    description="Nothing matches these filters yet. Create a ticket to get started."
                    action={
                      <button
                        type="button"
                        className={ui.btnPrimary}
                        onClick={() => setShowCreate(true)}
                      >
                        + New ticket
                      </button>
                    }
                  />
                )}
              {tickets.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {tickets.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={`${ui.listRow} w-full`}
                        onClick={() => navigate(`/tickets/${t.id}`)}
                      >
                        <TypeBadge type={t.type} />
                        <span className="flex-1 truncate font-medium">
                          {t.title}
                        </span>
                        <StateBadge state={t.state} />
                        <span className="hidden w-28 truncate text-xs text-slate-500 sm:block">
                          {epicTitle(t.epicId)}
                        </span>
                        <span className="hidden w-36 shrink-0 text-right text-xs tabular-nums text-slate-400 md:block">
                          {formatDateTime(t.modifiedAt)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>

      {showCreate && selectedTeam && (
        <TicketFormModal
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          epics={teamEpics}
          onClose={() => setShowCreate(false)}
          onCreated={(ticket) => {
            setShowCreate(false);
            navigate(`/tickets/${ticket.id}`);
          }}
        />
      )}
    </div>
  );
}
