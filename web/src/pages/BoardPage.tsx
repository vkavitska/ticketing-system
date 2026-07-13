import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import AppHeader from "../components/AppHeader";
import BoardColumn from "../components/BoardColumn";
import TicketCard from "../components/TicketCard";
import TicketFormModal from "../components/TicketFormModal";
import { useToast } from "../components/Toast";
import { ui } from "../lib/ui";
import { stateLabel, typeLabel } from "../lib/format";
import { listTeams } from "../api/teams";
import { listEpics } from "../api/epics";
import {
  TICKET_STATES,
  TICKET_TYPES,
  listTickets,
  updateTicket,
  type Ticket,
  type TicketFilters,
  type TicketState,
  type TicketType,
} from "../api/tickets";

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function BoardPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [teamId, setTeamId] = useState("");
  const [type, setType] = useState("");
  const [epicId, setEpicId] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const debouncedSearch = useDebounced(search, 300);

  const teamsQuery = useQuery({ queryKey: ["teams"], queryFn: listTeams });
  const epicsQuery = useQuery({ queryKey: ["epics"], queryFn: () => listEpics() });
  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const epics = useMemo(() => epicsQuery.data ?? [], [epicsQuery.data]);

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
    id ? (epics.find((e) => e.id === id)?.title ?? null) : null;

  const filters: TicketFilters = {
    teamId: teamId || undefined,
    type: (type || undefined) as TicketType | undefined,
    epicId: epicId || undefined,
    search: debouncedSearch || undefined,
  };
  const ticketsKey = ["tickets", filters] as const;
  const ticketsQuery = useQuery({
    queryKey: ticketsKey,
    queryFn: () => listTickets(filters),
    enabled: Boolean(teamId),
  });
  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);

  // Columns are derived from the query data — never a separate store.
  const grouped = useMemo(() => {
    const by = Object.fromEntries(
      TICKET_STATES.map((s) => [s, [] as Ticket[]]),
    ) as Record<TicketState, Ticket[]>;
    for (const t of tickets) by[t.state]?.push(t);
    for (const s of TICKET_STATES) {
      by[s].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    }
    return by;
  }, [tickets]);

  const activeTicket = activeId
    ? (tickets.find((t) => t.id === activeId) ?? null)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const newState = String(over.id) as TicketState;
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket || ticket.state === newState) return;

    // Optimistically move the card; roll back + toast on failure.
    await qc.cancelQueries({ queryKey: ticketsKey });
    const prev = qc.getQueryData<Ticket[]>(ticketsKey);
    qc.setQueryData<Ticket[]>(ticketsKey, (old) =>
      old?.map((t) => (t.id === id ? { ...t, state: newState } : t)),
    );
    try {
      await updateTicket(id, { state: newState });
    } catch {
      qc.setQueryData(ticketsKey, prev);
      toast.error("Couldn’t move the ticket. Change reverted.");
    } finally {
      qc.invalidateQueries({ queryKey: ["tickets"] });
    }
  }

  const selectedTeam = teams.find((t) => t.id === teamId) ?? null;
  const noTeams = teams.length === 0 && !teamsQuery.isPending;

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold">Board</h1>
            {!noTeams && (
              <>
                <div className="w-40">
                  <select
                    aria-label="Team"
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
                <div className="w-32">
                  <select
                    aria-label="Type filter"
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
                <div className="w-40">
                  <select
                    aria-label="Epic filter"
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
                <div className="w-44">
                  <input
                    aria-label="Search by title"
                    type="search"
                    className={ui.input}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title…"
                  />
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className={ui.btnPrimary}
            onClick={() => setShowCreate(true)}
            disabled={!selectedTeam}
          >
            + New ticket
          </button>
        </div>

        {noTeams && (
          <div className={`${ui.panel} p-8 text-center`}>
            <p className="text-sm font-medium text-slate-900">No teams yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create a team on the Teams tab before adding tickets.
            </p>
          </div>
        )}

        {selectedTeam && ticketsQuery.isPending && (
          <p className="text-sm text-slate-500">Loading board…</p>
        )}

        {selectedTeam && ticketsQuery.isError && (
          <div>
            <p className={ui.statusError}>Couldn’t load the board.</p>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSm} mt-3`}
              onClick={() => ticketsQuery.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {selectedTeam && !ticketsQuery.isPending && !ticketsQuery.isError && (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {TICKET_STATES.map((state) => (
                <BoardColumn
                  key={state}
                  id={state}
                  label={stateLabel(state)}
                  count={grouped[state].length}
                >
                  {grouped[state].map((t) => (
                    <TicketCard
                      key={t.id}
                      ticket={t}
                      epicTitle={epicTitle(t.epicId)}
                    />
                  ))}
                </BoardColumn>
              ))}
            </div>

            <DragOverlay>
              {activeTicket ? (
                <div className={`${ui.boardCard} shadow-lg`}>
                  <span className={ui.badge}>{typeLabel(activeTicket.type)}</span>
                  <p className="mt-1 truncate text-sm font-medium">
                    {activeTicket.title}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {showCreate && selectedTeam && (
        <TicketFormModal
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          epics={teamEpics}
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
